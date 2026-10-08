'use server';

import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma, withTransaction, currentDbUser, withDbContext } from './db';
import { withAuthenticatedAction, mapStore, setAuthCookie, resolveUser, verifyUserRole } from './auth';
import type { Store } from './types';
import { ensureUserCapacity } from './billing';

const storeDetails = z.object({
  name: z.string().trim().min(2,'Informe o nome da loja.').max(120),
  cnpj: z.string().trim().max(30).default(''),
  address: z.string().trim().max(300).default(''),
  phone: z.string().trim().max(30).default(''),
});
const storeInput = storeDetails.extend({
  organizationId: z.string().uuid().optional(),
  organizationName: z.string().trim().min(2).max(120).optional(),
  adminName: z.string().trim().min(2).max(120),
  adminEmail: z.string().trim().toLowerCase().email().max(254),
  adminPassword: z.string().default('').refine(v=>Buffer.byteLength(v)<=72,'A senha deve ter até 72 bytes.'),
});

async function audit(action: string, details: string, targetStoreId?: string) {
  const actor=currentDbUser()!;
  await prisma.platformAuditLog.create({data:{action,details,actorId:actor.uid,actorName:actor.name,targetStoreId}});
}

export async function getPlatformDataAction() {
  return withAuthenticatedAction(async()=>{
    const [stores,organizations,logs]=await Promise.all([
      prisma.store.findMany({include:{organization:true,memberships:{include:{user:{select:{uid:true,name:true,email:true}}}}},orderBy:{createdAt:'asc'}}),
      prisma.organization.findMany({orderBy:{name:'asc'}}),
      prisma.platformAuditLog.findMany({orderBy:{date:'desc'},take:30}),
    ]);
    return {
      stores:stores.map(s=>({...mapStore(s),organizationName:s.organization.name,
        administrators:s.memberships.filter(m=>m.role==='Administrador').map(m=>m.user)})),
      organizations:organizations.map(o=>({id:o.id,name:o.name})),
      logs:logs.map(l=>({id:l.id,date:l.date.toISOString(),action:l.action,details:l.details,actorName:l.actorName})),
    };
  },'platform');
}

export async function createStoreAction(input: z.input<typeof storeInput>): Promise<Store> {
  return withAuthenticatedAction(async()=>{
    const values=storeInput.parse(input);
    const passwordHash=values.adminPassword.length>=12 ? await bcrypt.hash(values.adminPassword,12) : null;
    return withTransaction(async tx=>{
      let organizationId=values.organizationId;
      if (organizationId && !await tx.organization.findUnique({where:{id:organizationId}})) throw new Error('Empresa não encontrada.');
      if (!organizationId) organizationId=(await tx.organization.create({data:{name:values.organizationName ?? values.name}})).id;
      const existing=await tx.user.findUnique({where:{email:values.adminEmail}});
      if(existing?.isPlatformAdmin || existing?.disabled) throw new Error('Use uma conta operacional ativa como administrador da loja.');
      if(!existing && !passwordHash) throw new Error('Para um novo administrador, use uma senha com pelo menos 12 caracteres.');
      const store=await tx.store.create({data:{name:values.name,cnpj:values.cnpj || null,address:values.address || null,phone:values.phone || null,organizationId}});
      const admin=existing ?? await tx.user.create({data:{uid:randomUUID(),name:values.adminName,email:values.adminEmail,passwordHash:passwordHash!,role:'Administrador',storeId:store.id}});
      await tx.storeMembership.create({data:{userId:admin.uid,storeId:store.id,role:'Administrador'}});
      await tx.systemConfig.create({data:{key:`products_counter:${store.id}`,storeId:store.id,value:{lastSku:0}}});
      await audit('Criar loja',`Loja ${store.name} criada; administrador ${admin.email}.`,store.id);
      return mapStore(store);
    });
  },'platform');
}

export async function updateStoreStatusAction(storeId: string, status: Store['status']): Promise<void> {
  return withAuthenticatedAction(async()=>{
    z.string().uuid().parse(storeId);
    if (!['Ativa','Suspensa'].includes(status)) throw new Error('Status inválido.');
    await withTransaction(async tx=>{
      const store=await tx.store.update({where:{id:storeId},data:{status}});
      await audit(status==='Ativa'?'Reativar loja':'Suspender loja',`Loja ${store.name}: ${status}.`,storeId);
    });
  },'platform');
}

export async function selectStoreAction(storeId: string, reason?: string) {
  return withAuthenticatedAction(async()=>{
    z.string().uuid().parse(storeId);
    const actor=currentDbUser()!;
    if(actor.isPlatformAdmin) z.string().trim().min(5,'Informe o motivo do acesso de suporte.').max(500).parse(reason);
    const selected=await resolveUser(actor.uid,storeId);
    if(selected?.storeId!==storeId) throw new Error('Você não possui acesso a esta loja ou ela está suspensa.');
    if(actor.isPlatformAdmin) await withDbContext({platformAdmin:true},()=>audit('Acessar loja',`Acesso de suporte à loja ${selected.store?.name}. Motivo: ${reason}`,storeId));
    await setAuthCookie(actor.uid,storeId);
    return selected;
  },'identity');
}

export async function updateStoreDetailsAction(input: z.input<typeof storeDetails>, expectedStoreId: string): Promise<Store> {
  return withAuthenticatedAction(async()=>{
    const user=await verifyUserRole(['Administrador']);
    if(expectedStoreId!==user.storeId) throw new Error('A loja ativa mudou. Atualize a página para continuar.');
    const values=storeDetails.parse(input);
    return withTransaction(async tx=>{
      const store=await tx.store.update({where:{id:user.storeId!},data:{name:values.name,cnpj:values.cnpj || null,address:values.address || null,phone:values.phone || null}});
      await tx.auditLog.create({data:{action:'Atualizar dados da loja',details:`Dados de ${store.name} atualizados.`,userUid:user.uid,userName:user.name,storeId:store.id}});
      return mapStore(store);
    });
  });
}

export async function grantStoreAccessAction(storeId: string, email: string, role: string): Promise<void> {
  return withAuthenticatedAction(async()=>{
    z.string().uuid().parse(storeId);
    const normalized=z.string().trim().toLowerCase().email().parse(email);
    if(!['Administrador','Gerente','Operador de Caixa','Estoquista'].includes(role)) throw new Error('Cargo inválido.');
    await withTransaction(async tx=>{
      const user=await tx.user.findUnique({where:{email:normalized}});
      if(!user) throw new Error('Conta não encontrada. O usuário precisa ter uma conta existente.');
      if(user.isPlatformAdmin) throw new Error('A conta global não deve ser vinculada à operação de lojas.');
      if(user.disabled) throw new Error('Reative a conta antes de vincular acesso.');
      const previous=await tx.storeMembership.findUnique({where:{userId_storeId:{userId:user.uid,storeId}}});
      if(previous?.role==='Administrador' && role!=='Administrador' && await tx.storeMembership.count({where:{storeId,role:'Administrador',user:{disabled:false}}})<=1) throw new Error('Vincule outro administrador ativo antes de alterar este cargo.');
      await ensureUserCapacity(storeId,user.uid);
      await tx.storeMembership.upsert({where:{userId_storeId:{userId:user.uid,storeId}},create:{userId:user.uid,storeId,role},update:{role}});
      await audit('Vincular usuário',`${normalized} vinculado com cargo ${role}.`,storeId);
    });
  },'platform');
}
