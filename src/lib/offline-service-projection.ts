import type {OfflineOperation} from './offline-operation-types';
import type {User,Sale} from './types';
export function projectService(base:any,operations:OfflineOperation[],user:User,core?:any){
 const d=JSON.parse(JSON.stringify(base??{tables:[],products:[],sessions:[],sales:[],tickets:[]}));
 if(core?.products)d.products=core.products.filter((p:any)=>p.status==='Ativo');
 if(core?.cashSessions)d.sessions=core.cashSessions.filter((s:any)=>s.status==='Aberto').map((s:any)=>({id:s.id,openedByName:s.openedBy.name}));
 let result:any;
 const payments=(rows:any[])=>rows.map(p=>({method:p.method==='Crédito'||p.method==='Débito'?'Cartão':p.method,amount:p.amount,...(p.method==='Crédito'||p.method==='Débito'?{cardType:p.method}:{})}));
 for(const op of operations){const p=op.args,id=op.id,date=op.createdAt;result=undefined;
  const tab=(tabId:string)=>d.tables.flatMap((t:any)=>t.tabs).find((t:any)=>t.id===tabId);
  const sale=(items:any[],sessionId:string,paymentRows:any[],name='Consumidor final'):Sale=>({id,date,items,total:Math.round(items.reduce((n:number,i:any)=>n+i.price*i.quantity,0)*100)/100,customerId:'default',customerName:name,paymentMethods:payments(paymentRows),status:'Pendente',cashRegisterSessionId:sessionId,storeSnapshot:user.store,clientRequestId:id});
  const ticketsFor=(saleId:string,items:any[])=>{const existing=d.tickets.filter((t:any)=>t.saleId===saleId);if(existing.length)return existing;let index=0;const rows=items.flatMap((item:any,itemIndex:number)=>Array.from({length:item.quantity},(_,unit)=>({id:id+'-'+index,storeId:user.storeId,saleId,itemIndex,unitIndex:unit+1,code:op.ticketCodes?.[index++]??'',productName:item.productName,status:'Pendente',issuedAt:date,issuedBy:user.uid,redeemedAt:null,redeemedBy:null})));d.tickets.unshift(...rows);return rows;};
  switch(op.kind){
   case 'saveTable':if(p[0].id){const t=d.tables.find((t:any)=>t.id===p[0].id);if(t)Object.assign(t,p[0]);}else if(!d.tables.some((t:any)=>t.id===id))d.tables.push({id,storeId:user.storeId,...p[0],tabs:[]});break;
   case 'openTab':{const t=d.tables.find((t:any)=>t.id===p[0]);if(t&&!t.tabs.length)t.tabs.push({id,storeId:user.storeId,tableId:t.id,customerName:p[1]??'',status:'Aberta',openedAt:date,openedBy:user.uid,closedAt:null,saleId:null,items:[]});result=id;break;}
   case 'addItem':{const t=tab(p[0].tabId),product=d.products.find((r:any)=>r.id===p[0].productId);if(t&&product&&!t.items.some((i:any)=>i.requestId===p[0].requestId))t.items.push({id,storeId:user.storeId,tabId:t.id,productId:product.id,productName:product.name,quantity:p[0].quantity,price:p[0].expectedPrice,costAtTimeOfUse:product.averageCost??0,unit:product.unit,requestId:p[0].requestId,addedAt:date,addedBy:user.uid,cancelledAt:null,cancelledBy:null,cancellationReason:null});break;}
   case 'removeItem':for(const t of d.tables)for(const account of t.tabs)account.items=account.items.filter((i:any)=>i.id!==p[0]);break;
   case 'cancelTab':for(const t of d.tables)t.tabs=t.tabs.filter((account:any)=>account.id!==p[0]);break;
   case 'closeTab':{const t=tab(p[0].tabId),table=d.tables.find((r:any)=>r.tabs.some((t:any)=>t.id===p[0].tabId));if(t){const grouped=new Map<string,any>();for(const i of t.items){const prior=grouped.get(i.productId);if(prior)prior.quantity+=i.quantity;else grouped.set(i.productId,{productId:i.productId,productName:i.productName,quantity:i.quantity,price:i.price,unit:i.unit});}result=sale([...grouped.values()],p[0].sessionId,p[0].payments,table.name+(t.customerName?' · '+t.customerName:''));d.sales.unshift(result);table.tabs=[];}break;}
   case 'purchaseTickets':{const product=d.products.find((r:any)=>r.id===p[0].productId);if(product){const v=sale([{productId:product.id,productName:product.name,quantity:p[0].quantity,price:p[0].expectedPrice,unit:product.unit}],p[0].sessionId,p[0].payments);d.sales.unshift(v);result={sale:v,tickets:ticketsFor(v.id,v.items)};}break;}
   case 'issueTickets':{const v=d.sales.find((s:any)=>s.id===p[0])??core?.sales?.find((s:any)=>s.id===p[0]);if(v)result=ticketsFor(v.id,v.items);break;}
   case 'redeemTicket':{const t=d.tickets.find((t:any)=>t.code===p[0].trim().toUpperCase());if(t){t.status='Retirada';t.redeemedAt=date;t.redeemedBy=user.uid;result=t.productName;}break;}
  }
 }
 return {data:d,result};
}
