'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { withAuthenticatedAction, setAuthCookie, resolveUser } from './auth';
import { prisma, withDbContext, withTransaction, currentDbUser } from './db';
import { recordLoginAttempt, clearLoginAttempts } from './login-rate-limit';

const identity = {uid:true,name:true,email:true,avatarUrl:true,createdAt:true,sessionVersion:true} as const;
const avatarDir=()=>process.env.ALVORADA_AVATAR_DIR || path.resolve(process.cwd(),'uploads','avatars');
const avatarFile=(url:string)=>/^\/api\/avatars\/([a-f0-9-]{36})\/([a-f0-9-]{36})\.webp$/.exec(url);

export async function getProfileAction() {
  return withAuthenticatedAction(async()=>{
    const user=currentDbUser()!;
    const record=await prisma.user.findUniqueOrThrow({where:{uid:user.uid},select:identity});
    return {...record,createdAt:record.createdAt.toISOString(),isPlatformAdmin:user.isPlatformAdmin,stores:user.stores??[]};
  },'identity');
}

async function updateProfile(input:unknown) {
  const value=z.object({name:z.string().trim().min(2,'Use pelo menos 2 caracteres no nome.').max(120),photo:z.string().max(280000).optional(),removePhoto:z.boolean().optional()}).strict().parse(input);
  return withAuthenticatedAction(async()=>{
    const user=currentDbUser()!;
    let nextUrl:string|undefined, savedFile:string|undefined;
    if(value.photo && value.removePhoto)throw new Error('Selecione uma foto ou remova a atual.');
    if(value.photo){
      if(!/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(value.photo))throw new Error('Formato de foto inválido.');
      const bytes=Buffer.from(value.photo.split(',')[1],'base64');
      if(bytes.length<20 || bytes.length>200000 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WEBP')throw new Error('Foto inválida ou muito grande.');
      const filename=randomUUID()+'.webp';
      const directory=path.join(avatarDir(),user.uid);
      await mkdir(directory,{recursive:true});
      savedFile=path.join(directory,filename);
      await writeFile(savedFile,bytes,{flag:'wx'});
      nextUrl=`/api/avatars/${user.uid}/${filename}`;
    }
    let previous:string|null=null;
    try{
      await withDbContext({profileWrite:true},()=>withTransaction(async()=>{
        const record=await prisma.user.findUniqueOrThrow({where:{uid:user.uid},select:{avatarUrl:true}});
        previous=record.avatarUrl;
        await prisma.user.update({where:{uid:user.uid},data:{name:value.name,...(nextUrl?{avatarUrl:nextUrl}:value.removePhoto?{avatarUrl:null}:{})}});
        await profileAudit('Atualizar perfil');
      }));
    }catch(error){if(savedFile)await unlink(savedFile).catch(()=>{});throw error;}
    if((nextUrl || value.removePhoto) && previous){const parts=avatarFile(previous);if(parts && parts[1]===user.uid)await unlink(path.join(avatarDir(),parts[1],parts[2]+'.webp')).catch(()=>{});}
    return resolveUser(user.uid,user.storeId);
  },'identity');
}

async function profileAudit(action:string){
  const user=currentDbUser()!;
  await prisma.platformAuditLog.create({data:{actorId:user.uid,actorName:user.name,action,details:'Operação realizada pelo titular da conta.'}});
}

const password=z.string().min(12,'Use pelo menos 12 caracteres.').refine(p=>Buffer.byteLength(p)<=72,'A senha deve ter no máximo 72 bytes.');
const currentPasswordSchema=z.string().min(1).max(72).refine(p=>Buffer.byteLength(p)<=72,'Senha atual inválida.');

async function changeOwnPassword(input:unknown){
  const value=z.object({currentPassword:currentPasswordSchema,newPassword:password,confirmation:z.string().max(72)}).strict().parse(input);
  if(value.newPassword!==value.confirmation)throw new Error('A confirmação da senha não confere.');
  if(value.currentPassword===value.newPassword)throw new Error('Escolha uma senha diferente da atual.');
  return secureSessionChange(value.currentPassword,value.newPassword);
}

async function revokeOtherSessions(currentPassword:string){
  currentPasswordSchema.parse(currentPassword);
  return secureSessionChange(currentPassword);
}

async function secureSessionChange(currentPassword:string,newPassword?:string){
  return withAuthenticatedAction(async()=>{
    const user=currentDbUser()!;
    const limitKey=`profile:${user.uid}`;
    recordLoginAttempt(limitKey);
    await withDbContext({profileWrite:true},()=>withTransaction(async()=>{
      const record=await prisma.user.findUniqueOrThrow({where:{uid:user.uid},select:{passwordHash:true,sessionVersion:true}});
      if(!(await bcrypt.compare(currentPassword,record.passwordHash)))throw new Error('A senha atual está incorreta.');
      const changed=await prisma.user.updateMany({where:{uid:user.uid,sessionVersion:record.sessionVersion},data:{sessionVersion:{increment:1},...(newPassword?{passwordHash:await bcrypt.hash(newPassword,12)}:{})}});
      if(changed.count!==1)throw new Error('A conta foi alterada. Entre novamente para continuar.');
      await profileAudit(newPassword?'Alterar própria senha':'Encerrar outras sessões');
    }));
    clearLoginAttempts(limitKey);
    await setAuthCookie(user.uid,user.storeId);
    return {success:true};
  },'identity');
}

const expectedErrors=new Set([
  'Selecione uma foto ou remova a atual.','Formato de foto inválido.','Foto inválida ou muito grande.',
  'A confirmação da senha não confere.','Escolha uma senha diferente da atual.','A senha atual está incorreta.',
  'A conta foi alterada. Entre novamente para continuar.','Usuário não autenticado.','Conta desabilitada.',
  'Muitas tentativas de login. Aguarde 15 minutos.','Aguarde alguns minutos antes de tentar novamente.',
]);
async function mutationResult<T>(operation:()=>Promise<T>):Promise<{ok:true;data:T}|{ok:false;error:string}>{
  try{return {ok:true,data:await operation()};}
  catch(error){
    if(error instanceof z.ZodError)return {ok:false,error:error.issues[0]?.code==='unrecognized_keys'?'Os dados enviados são inválidos.':error.issues[0]?.message??'Confira os dados enviados.'};
    if(error instanceof Error && expectedErrors.has(error.message))return {ok:false,error:error.message};
    console.error('Falha na alteração de perfil:',error);
    return {ok:false,error:'Não foi possível concluir a alteração. Tente novamente.'};
  }
}
export async function updateProfileAction(input:unknown){return mutationResult(()=>updateProfile(input));}
export async function changeOwnPasswordAction(input:unknown){return mutationResult(()=>changeOwnPassword(input));}
export async function revokeOtherSessionsAction(currentPassword:string){return mutationResult(()=>revokeOtherSessions(currentPassword));}
