'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { prisma, withTransaction, currentDbUser } from './db';
import { withAuthenticatedAction, setAuthCookie } from './auth';
import { commercialToday, ensureUserCapacity, generateDueInvoices } from './billing';

const uuid=z.string().uuid();
const roles=z.enum(['Administrador','Gerente','Operador de Caixa','Estoquista']);
const reasonSchema=z.string().trim().min(5,'Informe um motivo com pelo menos 5 caracteres.').max(500);
async function audit(action:string,details:string,targetStoreId?:string) {
  const actor=currentDbUser()!;
  await prisma.platformAuditLog.create({data:{action,details,actorId:actor.uid,actorName:actor.name,targetStoreId}});
}
const serialize=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

export async function getAdminDataAction(section='overview',query='',page=1) {
  return withAuthenticatedAction(async()=>{
    const q=z.string().max(150).parse(query).trim(), skip=(z.number().int().min(1).max(100000).parse(page)-1)*20;
    z.enum(['overview','stores','users','plans','subscriptions','invoices','audit']).parse(section);
    const today=commercialToday();
    const month=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),1));
    const [storeCount,activeStores,userCount,activeSubscriptions,recurring,received,pending,overdue,stores,plans,organizations]=await Promise.all([
      prisma.store.count(),prisma.store.count({where:{status:'Ativa'}}),prisma.user.count({where:{disabled:false,isPlatformAdmin:false}}),
      prisma.subscription.count({where:{status:'Ativa'}}),prisma.subscription.aggregate({where:{status:'Ativa'},_sum:{priceCents:true}}),
      prisma.invoice.aggregate({where:{status:'Pago',paidAt:{gte:month}},_sum:{amountCents:true}}),
      prisma.invoice.aggregate({where:{status:'Pendente'},_sum:{amountCents:true}}),prisma.invoice.count({where:{status:'Pendente',dueDate:{lt:today}}}),
      prisma.store.findMany({select:{id:true,name:true,status:true},orderBy:{name:'asc'},take:1000}),
      prisma.plan.findMany({orderBy:{name:'asc'},take:1000}),prisma.organization.findMany({select:{id:true,name:true},orderBy:{name:'asc'},take:1000}),
    ]);
    let records:unknown[]=[], total=0;
    if(section==='stores') {
      const where=q?{OR:[{name:{contains:q,mode:'insensitive' as const}},{organization:{name:{contains:q,mode:'insensitive' as const}}}]}:{};
      [records,total]=await Promise.all([prisma.store.findMany({where,skip,take:20,orderBy:{createdAt:'desc'},include:{organization:true,subscription:{include:{plan:true}},memberships:{where:{role:'Administrador'},include:{user:{select:{name:true,email:true}}}},_count:{select:{memberships:true}}}}),prisma.store.count({where})]);
    } else if(section==='users') {
      const where=q?{OR:[{name:{contains:q,mode:'insensitive' as const}},{email:{contains:q,mode:'insensitive' as const}}]}:{};
      [records,total]=await Promise.all([prisma.user.findMany({where,skip,take:20,orderBy:{createdAt:'desc'},select:{uid:true,name:true,email:true,disabled:true,isPlatformAdmin:true,createdAt:true,memberships:{include:{store:{select:{name:true,id:true}}}}}}),prisma.user.count({where})]);
    } else if(section==='plans') {
      const where=q?{name:{contains:q,mode:'insensitive' as const}}:{};
      [records,total]=await Promise.all([prisma.plan.findMany({where,skip,take:20,orderBy:{createdAt:'desc'},include:{_count:{select:{subscriptions:true}}}}),prisma.plan.count({where})]);
    } else if(section==='subscriptions') {
      const where=q?{store:{name:{contains:q,mode:'insensitive' as const}}}:{};
      [records,total]=await Promise.all([prisma.subscription.findMany({where,skip,take:20,orderBy:{startedAt:'desc'},include:{store:{select:{name:true,id:true}},plan:true}}),prisma.subscription.count({where})]);
    } else if(section==='invoices') {
      const where=q?{subscription:{store:{name:{contains:q,mode:'insensitive' as const}}}}:{};
      [records,total]=await Promise.all([prisma.invoice.findMany({where,skip,take:20,orderBy:[{dueDate:'desc'},{id:'asc'}],include:{subscription:{include:{store:{select:{name:true}}}}}}),prisma.invoice.count({where})]);
    } else {
      const where=q?{OR:[{details:{contains:q,mode:'insensitive' as const}},{action:{contains:q,mode:'insensitive' as const}},{actorName:{contains:q,mode:'insensitive' as const}}]}:{};
      [records,total]=await Promise.all([prisma.platformAuditLog.findMany({where,skip,take:section==='overview'?8:20,orderBy:{date:'desc'}}),prisma.platformAuditLog.count({where})]);
    }
    return serialize({records,total,stores,plans,organizations,today:today.toISOString(),metrics:{storeCount,activeStores,userCount,activeSubscriptions,recurring:recurring._sum.priceCents??0,received:received._sum.amountCents??0,pending:pending._sum.amountCents??0,overdue}});
  },'platform');
}

export async function savePlanAction(input:unknown) {
  return withAuthenticatedAction(()=>withTransaction(async()=>{
    const v=z.object({id:uuid.optional(),name:z.string().trim().min(2).max(120),priceCents:z.number().int().min(0).max(100000000),maxUsers:z.number().int().min(1).max(10000),active:z.boolean(),description:z.string().max(1000)}).parse(input);
    const {id,...data}=v;
    const plan=id?await prisma.plan.update({where:{id},data}):await prisma.plan.create({data});
    await audit(id?'Editar plano':'Criar plano',`${plan.name}; mensalidade ${(plan.priceCents/100).toFixed(2)}; limite ${plan.maxUsers}. Contratos existentes preservados.`);
  }),'platform');
}

export async function saveSubscriptionAction(input:unknown) {
  return withAuthenticatedAction(async()=>{
    await withTransaction(async()=>{
      const v=z.object({id:uuid.optional(),storeId:uuid,planId:uuid,priceCents:z.number().int().min(0).max(100000000),maxUsers:z.number().int().min(1).max(10000),nextDue:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),notes:z.string().max(2000)}).parse(input);
      const plan=await prisma.plan.findUniqueOrThrow({where:{id:v.planId}});
      if(!plan.active) throw new Error('Selecione um plano disponível.');
      const date=new Date(v.nextDue+'T12:00:00Z');
      if(!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==v.nextDue) throw new Error('Data inválida.');
      if(date<new Date('2020-01-01') || date>new Date('2100-01-01')) throw new Error('Data fora do intervalo permitido.');
      const count=await prisma.storeMembership.count({where:{storeId:v.storeId}});
      if(count>v.maxUsers) throw new Error(`Esta loja já tem ${count} usuários. O limite não pode ser menor.`);
      const data={planId:v.planId,priceCents:v.priceCents,maxUsers:v.maxUsers,notes:v.notes};
      if(v.id) {
        const existing=await prisma.subscription.findUniqueOrThrow({where:{id:v.id}});
        if(existing.storeId!==v.storeId) throw new Error('A loja do contrato não pode ser alterada.');
        // An edit cannot move the cursor over already issued billing periods.
        if(existing.nextDue.toISOString().slice(0,10)!==v.nextDue) throw new Error('A próxima competência é controlada pela geração de cobranças. Pause ou cancele o contrato se necessário.');
        await prisma.subscription.update({where:{id:v.id},data});
      } else {
        if(await prisma.subscription.findUnique({where:{storeId:v.storeId}})) throw new Error('A loja já possui assinatura. Edite o contrato existente.');
        await prisma.subscription.create({data:{...data,storeId:v.storeId,nextDue:date,billingDay:date.getUTCDate()}});
      }
      await audit(v.id?'Editar assinatura':'Criar assinatura',`Contrato mensal por loja; plano ${plan.name}; valor ${(v.priceCents/100).toFixed(2)}; limite ${v.maxUsers}.`,v.storeId);
    });
    await generateDueInvoices();
  },'platform');
}

export async function setSubscriptionStatusAction(id:string,status:string,reason:string) {
  return withAuthenticatedAction(()=>withTransaction(async()=>{
    uuid.parse(id);reasonSchema.parse(reason);z.enum(['Ativa','Pausada','Cancelada']).parse(status);
    const existing=await prisma.subscription.findUniqueOrThrow({where:{id}});
    if(status==='Ativa' && existing.status!=='Ativa' && existing.nextDue<commercialToday()) throw new Error('Para retomar, ajuste a próxima cobrança pelo formulário de retomada.');
    await prisma.subscription.update({where:{id},data:{status}});
    await audit('Status da assinatura',`${status}. Motivo: ${reason}`,existing.storeId);
  }),'platform');
}

export async function resumeSubscriptionAction(id:string,nextDue:string,reason:string) {
  return withAuthenticatedAction(async()=>{
    await withTransaction(async()=>{
      uuid.parse(id);reasonSchema.parse(reason);z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(nextDue);
      const date=new Date(nextDue+'T12:00:00Z');
      if(!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==nextDue || date<commercialToday()) throw new Error('Informe uma data válida a partir de hoje.');
      const s=await prisma.subscription.findUniqueOrThrow({where:{id}});
      if(s.status==='Ativa') throw new Error('A assinatura já está ativa.');
      await prisma.subscription.update({where:{id},data:{status:'Ativa',nextDue:date,billingDay:date.getUTCDate()}});
      await audit('Retomar assinatura',`Próxima cobrança ${nextDue}. Motivo: ${reason}`,s.storeId);
    });
    await generateDueInvoices();
  },'platform');
}

export async function recordInvoicePaymentAction(input:unknown) {
  return withAuthenticatedAction(()=>withTransaction(async()=>{
    const v=z.object({id:uuid,paidAt:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),method:z.enum(['Pix','Transferência','Dinheiro','Cartão','Outro']),reference:z.string().trim().max(200),notes:z.string().max(2000)}).parse(input);
    const date=new Date(v.paidAt+'T12:00:00Z');
    if(!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==v.paidAt || date>commercialToday()) throw new Error('Data de pagamento inválida ou futura.');
    const invoice=await prisma.invoice.findUniqueOrThrow({where:{id:v.id},include:{subscription:true}});
    if(invoice.status!=='Pendente') throw new Error('Esta cobrança já foi paga ou cancelada.');
    await prisma.invoice.update({where:{id:v.id},data:{status:'Pago',paidAt:date,paymentMethod:v.method,paymentReference:v.reference,notes:v.notes}});
    await audit('Registrar pagamento',`Cobrança ${invoice.id}; ${(invoice.amountCents/100).toFixed(2)}; ${v.method}; referência ${v.reference}.`,invoice.subscription.storeId);
  }),'platform');
}

export async function changeInvoiceStatusAction(id:string,status:string,reason:string) {
  return withAuthenticatedAction(()=>withTransaction(async()=>{
    uuid.parse(id);reasonSchema.parse(reason);z.enum(['Pendente','Cancelada']).parse(status);
    const invoice=await prisma.invoice.findUniqueOrThrow({where:{id},include:{subscription:true}});
    if(status==='Cancelada' && invoice.status==='Pago') throw new Error('Estorne o registro de pagamento antes de cancelar a cobrança.');
    await prisma.invoice.update({where:{id},data:{status,paidAt:null,paymentMethod:null,paymentReference:null,notes:reason}});
    await audit(status==='Pendente'?'Reabrir cobrança / estornar registro':'Cancelar cobrança',`Cobrança ${id}; situação anterior ${invoice.status}; método anterior ${invoice.paymentMethod??'-'}; data anterior ${invoice.paidAt?.toISOString()??'-'}; referência anterior ${invoice.paymentReference??'-'}. Motivo: ${reason}`,invoice.subscription.storeId);
  }),'platform');
}

export async function manageUserAction(input:unknown) {
  return withAuthenticatedAction(()=>withTransaction(async()=>{
    const v=z.object({uid:uuid,operation:z.enum(['block','unblock','revoke','password','unlink']),reason:reasonSchema,password:z.string().optional(),storeId:uuid.optional()}).parse(input);
    const user=await prisma.user.findUniqueOrThrow({where:{uid:v.uid}});
    if(user.isPlatformAdmin) throw new Error('A conta global é protegida. Use o procedimento administrativo de implantação.');
    if(v.operation==='unlink') {
      if(!v.storeId) throw new Error('Selecione a loja.');
      const membership=await prisma.storeMembership.findUniqueOrThrow({where:{userId_storeId:{userId:v.uid,storeId:v.storeId}}});
      if(membership.role==='Administrador' && await prisma.storeMembership.count({where:{storeId:v.storeId,role:'Administrador',user:{disabled:false}}})<=1) throw new Error('Vincule outro administrador ativo antes de remover este acesso.');
      await prisma.storeMembership.delete({where:{userId_storeId:{userId:v.uid,storeId:v.storeId}}});
    }
    if(v.operation==='block') {
      const adminLinks=await prisma.storeMembership.findMany({where:{userId:v.uid,role:'Administrador'}});
      for(const link of adminLinks) if(await prisma.storeMembership.count({where:{storeId:link.storeId,role:'Administrador',user:{disabled:false}}})<=1) throw new Error('Esta conta é o último administrador ativo de uma loja. Vincule outro antes de bloqueá-la.');
    }
    let passwordHash:string|undefined;
    if(v.operation==='password') {
      const password=z.string().min(12).refine(p=>Buffer.byteLength(p)<=72).parse(v.password);
      passwordHash=await bcrypt.hash(password,12);
    }
    await prisma.user.update({where:{uid:v.uid},data:{sessionVersion:{increment:1},...(passwordHash?{passwordHash}:{}),...(v.operation==='block'?{disabled:true}:v.operation==='unblock'?{disabled:false}:{})}});
    await audit('Gerenciar usuário',`${user.email}; operação ${v.operation}. Motivo: ${v.reason}`,v.storeId);
  }),'platform');
}

export async function createPlatformUserAction(input:unknown) {
  return withAuthenticatedAction(async()=>{
    const v=z.object({name:z.string().trim().min(2).max(120),email:z.string().trim().toLowerCase().email(),password:z.string().min(12).refine(p=>Buffer.byteLength(p)<=72),storeId:uuid,role:roles}).parse(input);
    const passwordHash=await bcrypt.hash(v.password,12);
    await withTransaction(async()=>{
      await ensureUserCapacity(v.storeId);
      if(await prisma.user.findUnique({where:{email:v.email}})) throw new Error('E-mail já cadastrado. Use Vincular usuário.');
      const user=await prisma.user.create({data:{uid:randomUUID(),name:v.name,email:v.email,passwordHash,role:v.role,storeId:v.storeId}});
      await prisma.storeMembership.create({data:{userId:user.uid,storeId:v.storeId,role:v.role}});
      await audit('Criar usuário',`${v.email}; cargo ${v.role}.`,v.storeId);
    });
  },'platform');
}

export async function saveAdminStoreAction(input:unknown) {
  return withAuthenticatedAction(()=>withTransaction(async()=>{
    const v=z.object({id:uuid,name:z.string().trim().min(2).max(120),cnpj:z.string().max(30),phone:z.string().max(30),address:z.string().max(300)}).parse(input);
    const {id,...data}=v;
    await prisma.store.update({where:{id},data});
    await audit('Editar loja',`Dados cadastrais de ${v.name} atualizados.`,id);
  }),'platform');
}

export async function setAdminStoreStatusAction(id:string,status:string,reason:string) {
  return withAuthenticatedAction(()=>withTransaction(async()=>{
    uuid.parse(id);z.enum(['Ativa','Suspensa']).parse(status);reasonSchema.parse(reason);
    const store=await prisma.store.update({where:{id},data:{status}});
    await audit(status==='Ativa'?'Reativar loja':'Suspender loja',`${store.name}. Motivo: ${reason}`,id);
  }),'platform');
}

export async function returnToAdminAction() {
  return withAuthenticatedAction(async()=>{await setAuthCookie(currentDbUser()!.uid);},'platform');
}

export async function syncBillingAction() {
  return withAuthenticatedAction(async()=>{const count=await generateDueInvoices();await audit('Sincronizar cobranças',`${count} competências processadas.`);return count;},'platform');
}
