'use server';
import { z } from 'zod';
import { prisma, withTransaction, currentDbUser } from './db';
import { withAuthenticatedAction } from './auth';
import { MODULES } from './module-catalog';

export async function getModuleGrantsAction(query='') {
  return withAuthenticatedAction(async()=>{
    const q=z.string().trim().max(150).parse(query);
    return prisma.organization.findMany({where:q?{name:{contains:q,mode:'insensitive'}}:{},include:{modules:true,stores:{select:{id:true,name:true,status:true}}},orderBy:{name:'asc'},take:100});
  },'platform');
}

export async function setModuleGrantAction(input:unknown) {
  return withAuthenticatedAction(()=>withTransaction(async tx=>{
    const v=z.object({organizationId:z.string().uuid(),moduleKey:z.string(),enabled:z.boolean(),reason:z.string().trim().min(5).max(500)}).parse(input);
    if(!MODULES.some(m=>m.key===v.moduleKey))throw new Error('Módulo desconhecido.');
    const organization=await tx.organization.findUniqueOrThrow({where:{id:v.organizationId},include:{stores:{select:{id:true}}}});
    if(!v.enabled) {
      const open=await tx.serviceTab.count({where:{storeId:{in:organization.stores.map(s=>s.id)},status:'Aberta'}});
      if(open)throw new Error('Feche ou cancele as mesas abertas antes de bloquear o módulo.');
    }
    const actor=currentDbUser()!;
    await tx.organizationModule.upsert({where:{organizationId_moduleKey:{organizationId:v.organizationId,moduleKey:v.moduleKey}},create:{organizationId:v.organizationId,moduleKey:v.moduleKey,enabled:v.enabled,updatedBy:actor.uid},update:{enabled:v.enabled,updatedBy:actor.uid}});
    await tx.platformAuditLog.create({data:{action:v.enabled?'Liberar módulo':'Bloquear módulo',details:`${organization.name} (${organization.id}); módulo ${v.moduleKey}; motivo: ${v.reason}`,actorId:actor.uid,actorName:actor.name}});
  }),'platform');
}
