'use server';
import {z} from 'zod';
import {withAuthenticatedAction} from './auth';
import {prisma,withTransaction,currentDbUser} from './db';
async function audit(action:string,details:string){const user=currentDbUser()!;await prisma.platformAuditLog.create({data:{action,details,actorId:user.uid,actorName:user.name}});}
export async function getMaintenanceAdminAction(){
 return withAuthenticatedAction(async()=>JSON.parse(JSON.stringify({maintenance:await prisma.platformMaintenance.findUniqueOrThrow({where:{id:'global'}}),messages:await prisma.platformMessage.findMany({orderBy:{createdAt:'desc'},take:100})})),'platform');
}
export async function saveMaintenanceAction(input:unknown){
 return withAuthenticatedAction(()=>withTransaction(async tx=>{
  const v=z.object({enabled:z.boolean(),message:z.string().trim().min(5).max(2000),expectedReturn:z.string().datetime().nullable(),revision:z.number().int().nonnegative(),reason:z.string().trim().min(5).max(500)}).parse(input);
  const changed=await tx.platformMaintenance.updateMany({where:{id:'global',revision:v.revision},data:{enabled:v.enabled,message:v.message,expectedReturn:v.expectedReturn?new Date(v.expectedReturn):null,revision:{increment:1}}});
  if(!changed.count)throw new Error('A manutenção foi alterada em outra sessão. Atualize antes de salvar.');
  await audit(v.enabled?'Manutenção global ativada/atualizada':'Sistema liberado',v.reason+'; aviso: '+v.message);
 }),'platform');
}
export async function savePlatformMessageAction(input:unknown){
 return withAuthenticatedAction(()=>withTransaction(async()=>{
  const v=z.object({id:z.string().uuid().optional(),kind:z.enum(['notice','patchnotes']),title:z.string().trim().min(3).max(120),body:z.string().trim().min(5).max(10000),version:z.string().trim().max(40),publish:z.boolean()}).parse(input);
  const current=v.id?await prisma.platformMessage.findUniqueOrThrow({where:{id:v.id}}):null;
  if(current?.archived)throw new Error('Este comunicado está arquivado.');
  if(current?.publishedAt)throw new Error('Comunicados publicados são preservados. Arquive e publique uma nova versão.');
  const data={kind:v.kind,title:v.title,body:v.body,version:v.version,publishedAt:v.publish?new Date():null};
  const message=v.id?await prisma.platformMessage.update({where:{id:v.id},data}):await prisma.platformMessage.create({data});
  await audit(v.publish?'Comunicado publicado':'Rascunho salvo',message.title+'; '+message.id);
 }),'platform');
}
export async function archivePlatformMessageAction(id:string){
 return withAuthenticatedAction(()=>withTransaction(async()=>{
  const message=await prisma.platformMessage.update({where:{id:z.string().uuid().parse(id)},data:{archived:true}});
  await audit('Comunicado arquivado',message.title+'; '+message.id);
 }),'platform');
}
