'use server';
import {Prisma} from '@prisma/client';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {withAuthenticatedAction,getAuthenticatedUser} from './auth';
import {prisma,withTransaction,withDbContext} from './db';
import * as a from './db-actions';
import * as s from './service-actions';
import type {OfflineOperation} from './offline-operation-types';
import {operationLabels} from './offline-operation-types';
export async function submitOfflineOperationAction(input:OfflineOperation){
 try{return await withAuthenticatedAction(()=>withTransaction(async tx=>{
  const user=await getAuthenticatedUser();
  const v=z.object({id:z.string().uuid(),storeId:z.string().uuid(),userId:z.string().min(1),kind:z.string(),args:z.array(z.any()).max(8),createdAt:z.string().datetime(),guard:z.object({entity:z.enum(['product','customer','cashRegisterSession','accountsPayable','purchaseOrder']),id:z.string().uuid(),values:z.record(z.union([z.string(),z.number(),z.null()]))}).optional(),ticketCodes:z.array(z.string().regex(/^F-[A-F0-9]{16}$/)).max(200).optional()}).parse(input);
  if(Date.parse(v.createdAt)>Date.now()+300000)throw new Error('Data da operação inválida. Ajuste o relógio do dispositivo.');
  if(v.storeId!==user.storeId||v.userId!==user.uid)throw new Error('A operação pertence a outra conta ou loja.');
  if(!operationLabels[v.kind]||JSON.stringify(v.args).length>250000)throw new Error('Operação inválida.');
  const hash=createHash('sha256').update(JSON.stringify({id:v.id,storeId:v.storeId,userId:v.userId,kind:v.kind,args:v.args,ticketCodes:v.ticketCodes})).digest('hex');
  const previous=await tx.offlineReceipt.findUnique({where:{id:v.id}});
  if(previous){if(previous.inputHash!==hash)throw new Error('Identificador já utilizado para outra operação.');return {ok:true as const,result:previous.result};}
  if(v.guard){
   const allowed:Record<string,string[]>={product:['stock','price','averageCost','status'],customer:['balance','creditLimit'],cashRegisterSession:['status','totalSales','calculatedCashInDrawer','openingBalance','closingBalance'],accountsPayable:['status','amount'],purchaseOrder:['status']};
   if(Object.keys(v.guard.values).some(k=>!allowed[v.guard!.entity].includes(k)))throw new Error('Referência de conferência inválida.');
   const row=await (tx as any)[v.guard.entity].findFirst({where:{id:v.guard.id,storeId:user.storeId}});
   if(!row||Object.entries(v.guard.values).some(([key,value])=>row[key]!==value))throw new Error('Este registro mudou em outro dispositivo. Revise a operação pendente antes de continuar.');
  }
  const p=v.args,shop=user.storeId;
  const result=await withDbContext({entityId:v.id,ticketCodes:v.ticketCodes,eventTime:new Date(v.createdAt)},async()=>{
   switch(v.kind){
    case 'correctClosing':return a.correctCashClosingAction(p[0],p[1],shop,p[2]);
    case 'correctOpening':return a.correctOpeningBalanceAction(p[0],p[1],shop,p[2]);
    case 'reopenCash':return a.reopenCashRegisterAction(p[0],shop);
    case 'cancelOpening':return a.cancelCashRegisterOpeningAction(p[0],shop);
    case 'sale':return a.addSaleAction(p[0],p[1],shop);
    case 'addProduct':return a.addProductAction(p[0],shop);
    case 'updateProduct':return a.updateProductAction(p[0],shop);
    case 'setProductStatus':return a.setProductStatusAction(p[0],p[1],shop);
    case 'addStock':return a.addStockToProductsAction(p[0],p[1],shop);
    case 'adjustStock':return a.adjustStockAction(p[0],p[1],p[2],p[3]??'',shop);
    case 'addCustomer':return a.addCustomerAction(p[0],shop);
    case 'updateCustomer':return a.updateCustomerAction(p[0],shop);
    case 'deleteCustomer':return a.deleteCustomerAction(p[0],shop);
    case 'addCreditPayment':return a.addCreditPaymentAction(p[0],p[1],p[2],shop);
    case 'openCash':return a.openCashRegisterAction(p[0],shop);
    case 'closeCash':return a.closeCashRegisterAction(p[0],p[1],shop,p[2]??undefined);
    case 'addCashTransaction':return a.addCashTransactionAction(p[0],p[1],shop);
    case 'addSupplier':return a.addSupplierAction(p[0],shop);
    case 'updateSupplier':return a.updateSupplierAction(p[0],shop);
    case 'deleteSupplier':return a.deleteSupplierAction(p[0],shop);
    case 'addPayable':return a.addPayableAction(p[0],shop);
    case 'updatePayable':return a.updatePayableAction(p[0],p[1],shop);
    case 'deletePayable':return a.deletePayableAction(p[0],shop);
    case 'markPayablePaid':return a.markPayableAsPaidAction(p[0],p[1],p[2],shop);
    case 'addPurchaseOrder':return a.addPurchaseOrderAction(p[0],shop);
    case 'updatePurchaseOrder':return a.updatePurchaseOrderAction(p[0],p[1],shop);
    case 'receivePurchaseOrder':return a.receivePurchaseOrderAction(p[0],p[1],shop);
    case 'saveTable':return s.saveServiceTableAction(shop,p[0]);
    case 'openTab':return s.openServiceTabAction(shop,p[0],p[1]);
    case 'addItem':return s.addServiceItemAction(shop,p[0]);
    case 'removeItem':return s.removeServiceItemAction(shop,p[0],p[1]);
    case 'cancelTab':return s.cancelServiceTabAction(shop,p[0],p[1]);
    case 'closeTab':return s.closeServiceTabAction(shop,p[0]);
    case 'purchaseTickets':return s.purchasePickupTicketsAction(shop,p[0]);
    case 'issueTickets':return s.issuePickupTicketsAction(shop,p[0]);
    case 'redeemTicket':return s.redeemPickupTicketAction(shop,p[0]);
    default:throw new Error('Operação inválida.');
   }
  });
  const serialized=JSON.parse(JSON.stringify(result??null));
  await tx.offlineReceipt.create({data:{id:v.id,storeId:shop,userId:user.uid,kind:v.kind,inputHash:hash,result:serialized===null?Prisma.JsonNull:serialized}});
  return {ok:true as const,result:serialized};
 }));}catch(error){
  const code=(error as any)?.code;
  const transient=['P1001','P1002','P1008','P1017','P2024','P2034','MAINTENANCE'].includes(code);
  return {ok:false as const,confirmedRejected:!transient,error:code==='MAINTENANCE'?(error as Error).message:transient?'Servidor indisponível. Operação preservada para reenvio.':error instanceof Error?error.message:'Operação não confirmada.'};
 }
}
