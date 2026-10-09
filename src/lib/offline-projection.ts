import {projectService} from './offline-service-projection';
import type {OfflineOperation} from './offline-operation-types';
import type {User} from './types';
export type OfflineSnapshot=Record<string,any>;
export function projectOperations(base:OfflineSnapshot,operations:OfflineOperation[],user:User):OfflineSnapshot{
 const d=JSON.parse(JSON.stringify(base));
 for(const key of ['products','customers','suppliers','sales','cashSessions','cashTransactions','accountsPayable','purchaseOrders','stockEntryLogs','stockAdjustmentLogs'])d[key]??=[];
 const actor={uid:user.uid,name:user.name};
 const patch=(key:string,id:string,change:any)=>{d[key]=d[key].map((r:any)=>r.id===id?{...r,...change}:r);};
 const remove=(key:string,id:string)=>{d[key]=d[key].filter((r:any)=>r.id!==id);};
 const insert=(key:string,row:any)=>{if(!d[key].some((r:any)=>r.id===row.id))d[key].unshift(row);};
 let currentDate='' ;
 const stock=(id:string,qty:number,cost?:number)=>{const p=d.products.find((p:any)=>p.id===id);if(p){const next=p.stock+qty;const change:any={stock:next};if(cost!==undefined&&qty>0){change.averageCost=next>0?(p.stock*p.averageCost+qty*cost)/next:cost;change.costHistory=[...(p.costHistory??[]),{date:currentDate,quantity:qty,cost}];}patch('products',id,change);}};
 for(const op of operations){
  const p=op.args,id=op.id,date=op.createdAt;currentDate=date;
  const cash=(sessionId:string,amount:number,field?:string)=>{const s=d.cashSessions.find((s:any)=>s.id===sessionId);if(s)patch('cashSessions',s.id,{calculatedCashInDrawer:s.calculatedCashInDrawer+amount,...(field?{[field]:(s[field]??0)+Math.abs(amount)}:{})});};
  const recordSale=(sale:any,sessionId:string,takeStock=true)=>{ const paid=sale.paymentMethods.reduce((n:number,p:any)=>n+p.amount,0),change=Math.max(0,Math.round((paid-sale.total)*100)/100);let left=change; sale={...sale,paymentMethods:sale.paymentMethods.map((p:any)=>{if(p.method!=='Dinheiro')return p;const deducted=Math.min(p.amount,left);left-=deducted;return {...p,amount:Math.round((p.amount-deducted)*100)/100};}).filter((p:any)=>p.amount>0)}; const s=d.cashSessions.find((s:any)=>s.id===sessionId);insert('sales',{...sale,id,date,status:'Pendente',cashRegisterSessionId:sessionId,storeSnapshot:user.store});if(takeStock)for(const i of sale.items)stock(i.productId,-i.quantity);if(s){const by={...s.salesByPaymentMethod};for(const payment of sale.paymentMethods)by[payment.method]=(by[payment.method]??0)+payment.amount;patch('cashSessions',s.id,{totalSales:s.totalSales+sale.total,salesByPaymentMethod:by});cash(s.id,sale.paymentMethods.filter((p:any)=>p.method==='Dinheiro').reduce((n:number,p:any)=>n+p.amount,0));}const c=d.customers.find((c:any)=>c.id===sale.customerId);if(c)patch('customers',c.id,{loyaltyPoints:c.loyaltyPoints+Math.floor((sale.total-sale.paymentMethods.filter((p:any)=>p.method==='Pontos').reduce((n:number,p:any)=>n+p.amount,0))*0.1)-sale.paymentMethods.filter((p:any)=>p.method==='Pontos').reduce((n:number,p:any)=>n+p.amount*10,0),balance:c.balance+sale.paymentMethods.filter((p:any)=>p.method==='Fiado').reduce((n:number,p:any)=>n+p.amount,0)}); };
  const previousService=d.serviceData;
  const serviceResult=['saveTable','openTab','addItem','removeItem','cancelTab','closeTab','purchaseTickets','issueTickets','redeemTicket'].includes(op.kind)?projectService(previousService,[op],user,d):{data:previousService,result:undefined};
  d.serviceData=serviceResult.data;
  switch(op.kind){
   case 'addItem':stock(p[0].productId,-p[0].quantity);break;
   case 'removeItem':{const item=previousService?.tables.flatMap((t:any)=>t.tabs.flatMap((b:any)=>b.items)).find((i:any)=>i.id===p[0]);if(item)stock(item.productId,item.quantity);break;}
   case 'cancelTab':{const tab=previousService?.tables.flatMap((t:any)=>t.tabs).find((t:any)=>t.id===p[0]);if(tab)for(const item of tab.items)stock(item.productId,item.quantity);break;}
   case 'closeTab':if(serviceResult.result)recordSale(serviceResult.result,p[0].sessionId,false);break;
   case 'purchaseTickets':if(serviceResult.result?.sale)recordSale(serviceResult.result.sale,p[0].sessionId);break;
   case 'addProduct':insert('products',{...p[0],id,sku:'Local',status:'Ativo',averageCost:0,costHistory:[]});break;
   case 'updateProduct':patch('products',p[0].id,p[0]);break;
   case 'setProductStatus':patch('products',p[0],{status:p[1]});break;
   case 'addStock':for(const item of p[0])stock(item.productId,item.quantity,item.cost);insert('stockEntryLogs',{id,date,supplierId:p[1].id,supplierName:p[1].name,items:p[0].map((i:any)=>({...i,productName:d.products.find((r:any)=>r.id===i.productId)?.name??''})),totalCost:p[0].reduce((n:number,i:any)=>n+i.cost*i.quantity,0),totalItems:p[0].reduce((n:number,i:any)=>n+i.quantity,0),registeredBy:actor});break;
   case 'adjustStock':{const product=d.products.find((r:any)=>r.id===p[0]);if(product){insert('stockAdjustmentLogs',{id,date,productId:p[0],productName:product.name,oldQuantity:product.stock,newQuantity:p[1],reason:p[2],notes:p[3],adjustedBy:actor});patch('products',p[0],{stock:p[1]});}break;}
   case 'addCustomer':insert('customers',{...p[0],id,balance:0,loyaltyPoints:0});break;
   case 'updateCustomer':patch('customers',p[0].id,p[0]);break;
   case 'deleteCustomer':remove('customers',p[0]);break;
   case 'addSupplier':insert('suppliers',{...p[0],id});break;
   case 'updateSupplier':patch('suppliers',p[0].id,p[0]);break;
   case 'deleteSupplier':remove('suppliers',p[0]);break;
   case 'correctClosing':{const row=d.cashSessions.find((s:any)=>s.id===p[0]);if(row)patch('cashSessions',p[0],{closingBalance:p[1],closingByPaymentMethod:{...row.closingByPaymentMethod,Dinheiro:p[1]},correction:{date,user:actor,oldValue:row.closingBalance??0,newValue:p[1],reason:p[2],history:row.correction?[...(row.correction.history??[]),row.correction]:[]}});break;}
   case 'correctOpening':{const row=d.cashSessions.find((s:any)=>s.id===p[0]);if(row)patch('cashSessions',p[0],{openingBalance:p[1],calculatedCashInDrawer:row.calculatedCashInDrawer+p[1]-row.openingBalance,openingCorrection:{date,user:actor,oldValue:row.openingBalance,newValue:p[1],reason:p[2],history:row.openingCorrection?[...(row.openingCorrection.history??[]),row.openingCorrection]:[]}});break;}
   case 'reopenCash':patch('cashSessions',p[0],{status:'Aberto',closingTime:null,closingBalance:null,closedBy:null});break;
   case 'cancelOpening':remove('cashSessions',p[0]);break;
   case 'openCash':insert('cashSessions',{id,openingTime:date,closingTime:null,openingBalance:p[0],closingBalance:null,calculatedCashInDrawer:p[0],totalSales:0,salesByPaymentMethod:{Dinheiro:0,Pix:0,Cartão:0},totalExpenses:0,totalWithdrawals:0,totalCreditPayments:0,status:'Aberto',openedBy:actor,closedBy:null});break;
   case 'closeCash':patch('cashSessions',p[0],{status:'Fechado',closingTime:date,closingBalance:p[1],closedBy:actor,closingByPaymentMethod:p[2]});break;
   case 'addCashTransaction':insert('cashTransactions',{...p[0],id,sessionId:p[1],date,registeredBy:actor});cash(p[1],-p[0].amount,p[0].type==='Sangria'?'totalWithdrawals':'totalExpenses');break;
   case 'addCreditPayment':{const c=d.customers.find((r:any)=>r.id===p[0]);if(c)patch('customers',c.id,{balance:c.balance-p[1]});insert('cashTransactions',{id,sessionId:p[2],date,type:'Recebimento Fiado',amount:p[1],description:'Recebimento de fiado',customerId:p[0],customerName:c?.name??'',registeredBy:actor});cash(p[2],p[1],'totalCreditPayments');break;}
   case 'sale':recordSale(p[0],p[1]);break;
   case 'addPayable':insert('accountsPayable',{...p[0],id,status:'Pendente',registeredBy:actor,dateCreated:date});break;
   case 'updatePayable':patch('accountsPayable',p[0],p[1]);break;
   case 'deletePayable':remove('accountsPayable',p[0]);break;
   case 'markPayablePaid':{const payable=d.accountsPayable.find((r:any)=>r.id===p[0]);if(payable){patch('accountsPayable',p[0],{status:'Pago',paymentDate:date,cashSessionId:p[1]?p[2]:undefined});if(p[1])cash(p[2],-payable.amount,'totalExpenses');}break;}
   case 'addPurchaseOrder':insert('purchaseOrders',{...p[0],id,dateCreated:date,status:'Pendente',registeredBy:actor,items:p[0].items.map((i:any)=>({...i,quantityReceived:0}))});break;
   case 'updatePurchaseOrder':patch('purchaseOrders',p[0],p[1]);break;
   case 'receivePurchaseOrder':{const order=d.purchaseOrders.find((r:any)=>r.id===p[0]);if(order){for(const i of p[1])stock(i.productId,i.quantityReceived,i.cost);const items=order.items.map((i:any)=>({...i,quantityReceived:i.quantityReceived+(p[1].find((r:any)=>r.productId===i.productId)?.quantityReceived??0)}));patch('purchaseOrders',order.id,{items,dateReceived:date,status:items.every((i:any)=>i.quantityReceived>=i.quantityOrdered)?'Recebido':'Recebido Parcialmente'});}break;}
  }
 }
 return d;
}
