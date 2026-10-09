'use server';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { prisma, withTransaction, currentEntityId, currentTicketCodes, currentOperationTime } from './db';
import { withAuthenticatedAction, verifyUserRole } from './auth';
import { requireModule } from './module-access';
import { processSale } from './sales-service';
import type { Sale, User } from './types';

const id=z.string().uuid(), request=z.string().min(8).max(80);
const serialize=<T>(v:T):T=>JSON.parse(JSON.stringify(v));
async function audit(user:User,action:string,details:string) {
  await prisma.auditLog.create({data:{storeId:user.storeId!,userUid:user.uid,userName:user.name,action,details}});
}

export async function getServiceDataAction(storeId:string,query='') {
  return withAuthenticatedAction(async()=>{
    await requireModule('mesas_fichas',id.parse(storeId));
    const q=z.string().trim().max(100).parse(query);
    const [tables,products,sessions,sales,tickets]=await Promise.all([
      prisma.serviceTable.findMany({where:{storeId},include:{tabs:{where:{status:'Aberta'},include:{items:{where:{cancelledAt:null},orderBy:{addedAt:'asc'}}}}},orderBy:{name:'asc'}}),
      prisma.product.findMany({where:{storeId,status:'Ativo',...(q?{name:{contains:q,mode:'insensitive'}}:{})},select:{id:true,name:true,price:true,stock:true,unit:true},orderBy:{name:'asc'},take:100}),
      prisma.cashRegisterSession.findMany({where:{storeId,status:'Aberto'},select:{id:true,openedByName:true},orderBy:{openingTime:'desc'}}),
      prisma.sale.findMany({where:{storeId,status:'Concluída'},select:{id:true,date:true,items:true,total:true},orderBy:{date:'desc'},take:30}),
      prisma.pickupTicket.findMany({where:{storeId},orderBy:{issuedAt:'desc'},take:50}),
    ]);
    return serialize({tables,products,sessions,sales,tickets});
  });
}

export async function saveServiceTableAction(storeId:string,input:unknown) {
  return withAuthenticatedAction(()=>withTransaction(async tx=>{
    const user=await requireModule('mesas_fichas',id.parse(storeId));await verifyUserRole(['Administrador','Gerente']);
    const v=z.object({id:id.optional(),name:z.string().trim().min(1).max(60),active:z.boolean()}).parse(input);
    if(v.id&&!v.active&&await tx.serviceTab.count({where:{storeId,tableId:v.id,status:'Aberta'}}))throw new Error('Feche a conta antes de desativar a mesa.');
    if(v.id)await tx.serviceTable.update({where:{id:v.id,storeId},data:{name:v.name,active:v.active}});
    else await tx.serviceTable.create({data:{id:currentEntityId(),storeId,name:v.name,active:v.active}});
    await audit(user,'Cadastro de mesa',`${v.name}; ${v.active?'ativa':'inativa'}.`);
  }));
}

export async function openServiceTabAction(storeId:string,tableId:string,customerName='') {
  return withAuthenticatedAction(()=>withTransaction(async tx=>{
    const user=await requireModule('mesas_fichas',id.parse(storeId));id.parse(tableId);
    const table=await tx.serviceTable.findUniqueOrThrow({where:{id:tableId,storeId}});
    if(!table.active)throw new Error('Mesa desativada.');
    const existing=await tx.serviceTab.findFirst({where:{tableId,storeId,status:'Aberta'}});if(existing){if(currentEntityId()&&existing.id!==currentEntityId())throw new Error('Esta mesa foi aberta em outro dispositivo. Revise a conta antes de sincronizar.');return existing.id;}
    const tab=await tx.serviceTab.create({data:{id:currentEntityId(),openedAt:currentOperationTime(),storeId,tableId,customerName:z.string().trim().max(100).parse(customerName),openedBy:user.uid}});
    await audit(user,'Abertura de mesa',`${table.name}; conta ${tab.id}.`);return tab.id;
  }));
}

export async function addServiceItemAction(storeId:string,input:unknown) {
  return withAuthenticatedAction(()=>withTransaction(async tx=>{
    const user=await requireModule('mesas_fichas',id.parse(storeId));
    const v=z.object({tabId:id,productId:id,quantity:z.number().positive().max(10000),expectedPrice:z.number().nonnegative(),requestId:request}).parse(input);
    const existing=await tx.serviceTabItem.findUnique({where:{storeId_requestId:{storeId,requestId:v.requestId}}});
    if(existing){if(existing.cancelledAt)throw new Error('Este lançamento já foi estornado. Faça um novo lançamento.');if(existing.tabId!==v.tabId||existing.productId!==v.productId||existing.quantity!==v.quantity)throw new Error('Identificador de lançamento já utilizado.');return;}
    const tab=await tx.serviceTab.findUniqueOrThrow({where:{id:v.tabId,storeId}});if(tab.status!=='Aberta')throw new Error('Esta conta já foi encerrada.');
    if(await tx.serviceTabItem.count({where:{tabId:tab.id,storeId}})>=200)throw new Error('Limite de 200 lançamentos por conta.');
    const product=await tx.product.findUniqueOrThrow({where:{id:v.productId,storeId}});
    if(product.status!=='Ativo'||product.stock<v.quantity)throw new Error('Produto indisponível ou estoque insuficiente.');
    const earlier=await tx.serviceTabItem.findFirst({where:{tabId:tab.id,storeId,productId:product.id,cancelledAt:null},orderBy:{addedAt:'asc'}});
    if(Math.abs(v.expectedPrice-(earlier?.price??product.price))>0.000001)throw new Error('Preço alterado. Atualize a conta antes de lançar.');
    await tx.serviceTabItem.create({data:{id:currentEntityId(),addedAt:currentOperationTime(),storeId,tabId:tab.id,productId:product.id,productName:product.name,quantity:v.quantity,price:earlier?.price??product.price,costAtTimeOfUse:product.averageCost,unit:product.unit,requestId:v.requestId,addedBy:user.uid}});
    await tx.product.update({where:{id:product.id,storeId},data:{stock:{decrement:v.quantity}}});
    await audit(user,'Consumo da mesa',`Conta ${tab.id}; ${v.quantity} ${product.unit} de ${product.name}; estoque baixado.`);
  }));
}

export async function removeServiceItemAction(storeId:string,itemId:string,reason:string) {
  return withAuthenticatedAction(()=>withTransaction(async tx=>{
    const user=await requireModule('mesas_fichas',id.parse(storeId));await verifyUserRole(['Administrador','Gerente']);id.parse(itemId);z.string().trim().min(5).max(500).parse(reason);
    const item=await tx.serviceTabItem.findUnique({where:{id:itemId,storeId},include:{tab:true}});if(!item)return;
    if(item.cancelledAt)return;
    if(item.tab.status!=='Aberta')throw new Error('Conta encerrada.');
    await tx.product.update({where:{id:item.productId,storeId},data:{stock:{increment:item.quantity}}});
    await tx.serviceTabItem.update({where:{id:item.id,storeId},data:{cancelledAt:new Date(),cancelledBy:user.uid,cancellationReason:reason}});
    await audit(user,'Estorno de consumo',`Conta ${item.tabId}; ${item.quantity} ${item.unit} de ${item.productName}; motivo: ${reason}.`);
  }));
}

export async function cancelServiceTabAction(storeId:string,tabId:string,reason:string) {
  return withAuthenticatedAction(()=>withTransaction(async tx=>{
    const user=await requireModule('mesas_fichas',id.parse(storeId));await verifyUserRole(['Administrador','Gerente']);id.parse(tabId);z.string().trim().min(5).max(500).parse(reason);
    const tab=await tx.serviceTab.findUniqueOrThrow({where:{id:tabId,storeId},include:{items:{where:{cancelledAt:null}}}});
    if(tab.status==='Cancelada')return;if(tab.status!=='Aberta')throw new Error('Esta conta já foi paga. Cancele a venda pelo fluxo existente.');
    const restored=new Map<string,number>();for(const item of tab.items)restored.set(item.productId,(restored.get(item.productId)??0)+item.quantity);
    for(const [productId,quantity] of restored)await tx.product.update({where:{id:productId,storeId},data:{stock:{increment:quantity}}});
    await tx.serviceTab.update({where:{id:tab.id,storeId},data:{status:'Cancelada',closedAt:currentOperationTime()??new Date()}});
    await audit(user,'Cancelamento de mesa',`Conta ${tab.id}; estoque devolvido; motivo: ${reason}.`);
  }));
}

const payments=z.array(z.object({method:z.enum(['Dinheiro','Pix','Crédito','Débito']),amount:z.number().positive().max(1000000)})).min(1).max(4);
function asSalePayments(v:z.infer<typeof payments>):Sale['paymentMethods'] {
  return v.map(p=>({method:p.method==='Crédito'||p.method==='Débito'?'Cartão':p.method,amount:p.amount,...(p.method==='Crédito'||p.method==='Débito'?{cardType:p.method}:{})}));
}

export async function closeServiceTabAction(storeId:string,input:unknown) {
  return withAuthenticatedAction(()=>withTransaction(async tx=>{
    const user=await requireModule('mesas_fichas',id.parse(storeId));
    const v=z.object({tabId:id,sessionId:id,totalCents:z.number().int().positive(),payments}).parse(input);
    const tab=await tx.serviceTab.findUniqueOrThrow({where:{id:v.tabId,storeId},include:{items:{where:{cancelledAt:null}}}});
    if(tab.status==='Fechada'&&tab.saleId)return serialize(await tx.sale.findUniqueOrThrow({where:{id:tab.saleId,storeId}}));
    if(tab.status!=='Aberta')throw new Error('Conta encerrada.');
    const grouped=new Map<string,{productId:string;productName:string;quantity:number;price:number}>();
    for(const item of tab.items){const p=grouped.get(item.productId);if(p)p.quantity+=item.quantity;else grouped.set(item.productId,{productId:item.productId,productName:item.productName,quantity:item.quantity,price:item.price});}
    const items=[...grouped.values()],total=items.reduce((n,i)=>n+i.price*i.quantity,0);
    if(Math.round(total*100)!==v.totalCents)throw new Error('A conta da mesa mudou. Atualize antes de fechar.');
    const sale=await processSale({items,total:Math.round(total*100)/100,customerId:'default',customerName:tab.customerName||'Consumidor final',paymentMethods:asSalePayments(v.payments),clientRequestId:`mesa:${tab.id}`},v.sessionId,user,{serviceTabId:tab.id,manualPix:true});
    await tx.serviceTab.update({where:{id:tab.id,storeId},data:{status:'Fechada',saleId:sale.id,closedAt:currentOperationTime()??new Date()}});
    await audit(user,'Fechamento de mesa',`Conta ${tab.id}; venda ${sale.id}; total R$ ${sale.total.toFixed(2)}.${v.payments.some(p=>p.method==='Pix')?' Pix conferido manualmente pelo operador.':''}`);return serialize(sale);
  }));
}

async function issueTickets(saleId:string,user:User) {
  const sale=await prisma.sale.findUniqueOrThrow({where:{id:saleId,storeId:user.storeId}});
  if(sale.status!=='Concluída')throw new Error('Somente vendas concluídas podem emitir fichas.');
  const items=sale.items as unknown as Sale['items'];
  const units=items.reduce((n,i)=>n+i.quantity,0);
  if(items.some(i=>!Number.isInteger(i.quantity))||units>200)throw new Error('Fichas exigem quantidades inteiras, com até 200 unidades por venda.');
  const rows=[];
  for(let i=0;i<items.length;i++)for(let unit=1;unit<=items[i].quantity;unit++)rows.push({storeId:user.storeId!,saleId,issuedAt:currentOperationTime(),itemIndex:i,unitIndex:unit,code:currentTicketCodes()?.[rows.length]??'F-'+randomBytes(8).toString('hex').toUpperCase(),productName:items[i].productName,issuedBy:user.uid});
  await prisma.pickupTicket.createMany({data:rows,skipDuplicates:true});
  return serialize(await prisma.pickupTicket.findMany({where:{storeId:user.storeId,saleId},orderBy:[{itemIndex:'asc'},{unitIndex:'asc'}]}));
}

export async function issuePickupTicketsAction(storeId:string,saleId:string) {
  return withAuthenticatedAction(()=>withTransaction(async()=>{
    const user=await requireModule('mesas_fichas',id.parse(storeId));id.parse(saleId);const result=await issueTickets(saleId,user);
    await audit(user,'Emissão de fichas',`Venda ${saleId}; ${result.length} fichas; reimpressão mantém os mesmos códigos.`);return result;
  }));
}

export async function purchasePickupTicketsAction(storeId:string,input:unknown) {
  return withAuthenticatedAction(()=>withTransaction(async tx=>{
    const user=await requireModule('mesas_fichas',id.parse(storeId));
    const v=z.object({productId:id,quantity:z.number().int().min(1).max(200),sessionId:id,requestId:request,expectedPrice:z.number().nonnegative(),payments}).parse(input);
    const product=await tx.product.findUniqueOrThrow({where:{id:v.productId,storeId}});
    if(product.price!==v.expectedPrice)throw new Error('Preço alterado. Atualize os produtos.');
    const sale=await processSale({items:[{productId:product.id,productName:product.name,quantity:v.quantity,price:product.price}],total:Math.round(product.price*v.quantity*100)/100,customerId:'default',customerName:'Consumidor final',paymentMethods:asSalePayments(v.payments),clientRequestId:v.requestId},v.sessionId,user,{manualPix:true});
    const tickets=await issueTickets(sale.id,user);await audit(user,'Venda de fichas',`Venda ${sale.id}; ${tickets.length} fichas.${v.payments.some(p=>p.method==='Pix')?' Pix conferido manualmente pelo operador.':''}`);return {sale:serialize(sale),tickets};
  }));
}

export async function redeemPickupTicketAction(storeId:string,code:string) {
  return withAuthenticatedAction(()=>withTransaction(async tx=>{
    const user=await requireModule('mesas_fichas',id.parse(storeId));const normalized=z.string().trim().toUpperCase().regex(/^F-[A-F0-9]{16}$/).parse(code);
    const ticket=await tx.pickupTicket.findUnique({where:{code:normalized,storeId}});if(!ticket)throw new Error('Ficha não encontrada nesta loja.');
    const sale=await tx.sale.findUniqueOrThrow({where:{id:ticket.saleId,storeId}});if(sale.status!=='Concluída')throw new Error('A venda desta ficha foi cancelada.');
    if(ticket.status!=='Pendente')throw new Error('Esta ficha já foi utilizada.');
    await tx.pickupTicket.update({where:{id:ticket.id,storeId},data:{status:'Retirada',redeemedAt:currentOperationTime()??new Date(),redeemedBy:user.uid}});
    await audit(user,'Retirada por ficha',`${ticket.code}; ${ticket.productName}; venda ${ticket.saleId}.`);return ticket.productName;
  }));
}

export async function getServiceReportAction(storeId:string,from:string,to:string) {
  return withAuthenticatedAction(async()=>{
    await requireModule('mesas_fichas',id.parse(storeId));await verifyUserRole(['Administrador','Gerente']);
    const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);date.parse(from);date.parse(to);
    const start=new Date(from+'T00:00:00-03:00'),end=new Date(to+'T00:00:00-03:00');end.setTime(+end+86400000);
    if(!Number.isFinite(+start)||!Number.isFinite(+end)||end<=start||+end-+start>31*86400000)throw new Error('Selecione um período válido de até 31 dias.');
    const [sales,withdrawals,expenses]=await Promise.all([
      prisma.sale.findMany({where:{storeId,status:'Concluída',date:{gte:start,lt:end}},select:{total:true,paymentMethods:true},take:5001}),
      prisma.cashTransaction.aggregate({where:{storeId,type:'Sangria',date:{gte:start,lt:end}},_sum:{amount:true}}),
      prisma.cashTransaction.aggregate({where:{storeId,type:'Despesa',date:{gte:start,lt:end}},_sum:{amount:true}}),
    ]);
    if(sales.length>5000)throw new Error('Reduza o período para até 5.000 vendas.');
    const totals:Record<string,number>={Dinheiro:0,Pix:0,Crédito:0,Débito:0,'Cartão sem tipo':0};
    for(const sale of sales)for(const p of sale.paymentMethods as unknown as Sale['paymentMethods']){const key=p.method==='Cartão'?(p.cardType??'Cartão sem tipo'):p.method;totals[key]=(totals[key]??0)+p.amount;}
    return {count:sales.length,total:sales.reduce((n,s)=>n+s.total,0),payments:totals,withdrawals:withdrawals._sum.amount??0,expenses:expenses._sum.amount??0};
  });
}
