'use server';
import { Prisma } from '@prisma/client';
import { prisma,withTransaction } from './db';
import { withAuthenticatedAction,getAuthenticatedUser,verifyUserRole } from './auth';

function bounds(from:string,to:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to))throw new Error('Período inválido.');
 const start=new Date(from+'T00:00:00-03:00'),end=new Date(to+'T00:00:00-03:00');end.setUTCDate(end.getUTCDate()+1);
 if(!Number.isFinite(+start)||!Number.isFinite(+end)||start.toISOString().slice(0,10)!==from||new Date(to+'T00:00:00-03:00').toISOString().slice(0,10)!==to||+end<=+start||+end-+start>366*86400000)throw new Error('Escolha um período de até 366 dias.');
 return {start,end,previousStart:new Date(+start-(+end-+start))};
}
export async function searchStoreAction(query:string,storeId:string){return withAuthenticatedAction(async()=>{
 const user=await getAuthenticatedUser();if(storeId!==user.storeId)throw new Error('Loja ativa alterada.');
 const q=String(query).trim().slice(0,80);if(q.length<2)return [];
 const allowed=user.role!=='Estoquista';
 const [products,customers,sales]=await Promise.all([
 prisma.product.findMany({where:{storeId,OR:['name','sku','barcode'].map(key=>({[key]:{contains:q,mode:'insensitive'}}))},select:{id:true,name:true,sku:true},take:6,orderBy:{name:'asc'}}),
 allowed?prisma.customer.findMany({where:{storeId,OR:[{name:{contains:q,mode:'insensitive'}},{cpfCnpj:{contains:q}}]},select:{id:true,name:true},take:6,orderBy:{name:'asc'}}):[],
 allowed?prisma.sale.findMany({where:{storeId,OR:[{id:{contains:q,mode:'insensitive'}},{customerName:{contains:q,mode:'insensitive'}}]},select:{id:true,customerName:true,date:true,total:true},take:6,orderBy:{date:'desc'}}):[]]);
 return [...products.map(p=>({id:p.id,type:'Produtos',label:p.name+' · '+p.sku,url:'/dashboard/products?search='+encodeURIComponent(p.id)})),...customers.map(c=>({id:c.id,type:'Clientes',label:c.name,url:'/dashboard/customers/'+c.id})),...sales.map(s=>({id:s.id,type:'Vendas',label:s.customerName+' · R$ '+s.total.toFixed(2),url:'/dashboard/sales?search='+encodeURIComponent(s.id)}))];
});}
export async function getBusinessReportAction(storeId:string,from:string,to:string,view='sales'){return withAuthenticatedAction(async()=>{
 if(!['sales','products','cash','dashboard','inventory'].includes(view))throw new Error('Relatório inválido.');
 const user=await verifyUserRole(view==='inventory'?['Administrador','Gerente','Estoquista']:['Administrador','Gerente']);if(storeId!==user.storeId)throw new Error('Loja ativa alterada.');
 const {start,end,previousStart}=bounds(from,to);
 return withTransaction(async tx=>{
 const where={storeId,status:'Concluída',date:{gte:start,lt:end}};
 const [current,previous,days,products,cash,cancelled,counts]=await Promise.all([
 tx.sale.aggregate({where,_sum:{total:true,totalCost:true,totalProfit:true},_count:true}),
 tx.sale.aggregate({where:{...where,date:{gte:previousStart,lt:start}},_sum:{total:true,totalProfit:true},_count:true}),
 tx.$queryRaw<Array<{day:string;revenue:number;profit:number;count:bigint}>>(Prisma.sql`SELECT to_char(date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo','YYYY-MM-DD') AS day, sum(total)::float8 AS revenue, sum(COALESCE("totalProfit",0))::float8 AS profit,count(*) AS count FROM "Sale" WHERE "storeId"=${storeId} AND status='Concluída' AND date>=${start} AND date<${end} GROUP BY day ORDER BY day`),
 tx.$queryRaw<Array<{id:string;name:string;sku:string;stock:number;minStock:number;averageCost:number;units:number;liters:number;kilos:number;convertedUnits:number;revenue:number;profit:number}>>(Prisma.sql`WITH consumption AS (SELECT item->>'productId' AS id,sum((item->>'quantity')::float8) AS units,sum(CASE WHEN item->'measurement'->>'baseUnit'='L' THEN (item->>'quantity')::float8*(item->'measurement'->>'factor')::float8 ELSE 0 END) AS liters,sum(CASE WHEN item->'measurement'->>'baseUnit'='kg' THEN (item->>'quantity')::float8*(item->'measurement'->>'factor')::float8 ELSE 0 END) AS kilos,sum(CASE WHEN item->'measurement'->>'baseUnit'='un' THEN (item->>'quantity')::float8*(item->'measurement'->>'factor')::float8 ELSE 0 END) AS "convertedUnits",sum((item->>'quantity')::float8*(item->>'price')::float8) AS revenue,sum((item->>'quantity')::float8*((item->>'price')::float8-COALESCE((item->>'costAtTimeOfSale')::float8,0))) AS profit FROM "Sale",jsonb_array_elements(items) AS item WHERE "storeId"=${storeId} AND status='Concluída' AND date>=${start} AND date<${end} GROUP BY item->>'productId') SELECT p.id,p.name,p.sku,p.stock,p."minStock",p."averageCost",COALESCE(c.units,0)::float8 AS units,COALESCE(c.liters,0)::float8 AS liters,COALESCE(c.kilos,0)::float8 AS kilos,COALESCE(c."convertedUnits",0)::float8 AS "convertedUnits",COALESCE(c.revenue,0)::float8 AS revenue,COALESCE(c.profit,0)::float8 AS profit FROM "Product" p LEFT JOIN consumption c ON c.id=p.id WHERE p."storeId"=${storeId} AND p.status='Ativo' ORDER BY COALESCE(c.revenue,0) DESC,p.name LIMIT 5000`),
 tx.cashRegisterSession.aggregate({where:{storeId,status:'Fechado',closingTime:{gte:start,lt:end}},_sum:{totalSales:true,totalExpenses:true,totalWithdrawals:true,totalCreditPayments:true,closingBalance:true,calculatedCashInDrawer:true},_count:true}),
 tx.sale.aggregate({where:{storeId,status:'Cancelada',date:{gte:start,lt:end}},_sum:{total:true},_count:true}),
 Promise.all([tx.product.count({where:{storeId}}),tx.customer.count({where:{storeId}}),tx.purchaseOrder.count({where:{storeId,status:{in:['Pendente','Recebido Parcialmente']},dateExpected:{lt:new Date()}}})])]);
 const daysCount=(+end-+start)/86400000;
 return {from,to,daysCount,current:{revenue:current._sum.total??0,cost:current._sum.totalCost??0,profit:current._sum.totalProfit??0,count:current._count},previous:{revenue:previous._sum.total??0,profit:previous._sum.totalProfit??0,count:previous._count},days:days.map(d=>({...d,count:Number(d.count)})),products:products.map(p=>({...p,suggested:Math.max(0,Math.ceil(Math.max(p.minStock,p.units/daysCount*14)-p.stock))})),cash:{count:cash._count,...cash._sum},cancelled:{count:cancelled._count,total:cancelled._sum.total??0},counts:{products:counts[0],customers:counts[1],overdueOrders:counts[2]}};
 });
});}
export async function exportSalesAction(storeId:string,from:string,to:string,after?:string){return withAuthenticatedAction(async()=>{
 const user=await verifyUserRole(['Administrador','Gerente']);if(storeId!==user.storeId)throw new Error('Loja ativa alterada.');const {start,end}=bounds(from,to);
 const rows=await prisma.sale.findMany({where:{storeId,status:'Concluída',date:{gte:start,lt:end}},orderBy:{id:'asc'},take:1000,...(after?{cursor:{id:after},skip:1}:{}),select:{id:true,date:true,customerName:true,total:true,totalCost:true,totalProfit:true}});
 return {rows:rows.map(s=>({...s,date:s.date.toISOString()})),next:rows.length===1000?rows[rows.length-1].id:null};
});}
export async function getCustomerLedgerAction(storeId:string,customerId:string,page=1){return withAuthenticatedAction(async()=>{
 const user=await verifyUserRole(['Administrador','Gerente','Operador de Caixa']);if(storeId!==user.storeId||typeof customerId!=='string'||customerId.length>80||!Number.isInteger(page)||page<1)throw new Error('Consulta inválida.');
 return withTransaction(async tx=>{
 const customer=await tx.customer.findFirst({where:{id:customerId,storeId}});if(!customer)throw new Error('Cliente não encontrado.');
 type Row={id:string;date:Date;kind:string;description:string;amount:number;credit:number;points:number;balance:number;pointBalance:number;total:bigint;openingBalance:number;openingPoints:number};
 const rows=await tx.$queryRaw<Row[]>(Prisma.sql`WITH sale_values AS (
 SELECT s.*,COALESCE((SELECT sum((p->>'amount')::float8) FROM jsonb_array_elements(s."paymentMethods") p WHERE p->>'method'='Fiado'),0) AS credit,COALESCE((SELECT sum((p->>'amount')::float8) FROM jsonb_array_elements(s."paymentMethods") p WHERE p->>'method'='Pontos'),0) AS redeemed FROM "Sale" s WHERE s."storeId"=${storeId} AND s."customerId"=${customerId}
 ), events AS (
 SELECT id,date,'Venda' AS kind,'Venda '||left(id,8) AS description,total AS amount,credit,floor((total-redeemed)*0.1)-redeemed*10 AS points FROM sale_values
 UNION ALL SELECT id||'-cancel',"cancellationDate",'Cancelamento',COALESCE("cancellationReason",'Cancelamento da venda'),-total,-credit,-floor((total-redeemed)*0.1)+redeemed*10 FROM sale_values WHERE status='Cancelada' AND "cancellationDate" IS NOT NULL
 UNION ALL SELECT id,date,'Recebimento',description,-amount,-amount,0::float8 FROM "CashTransaction" WHERE "storeId"=${storeId} AND "customerId"=${customerId} AND type='Recebimento Fiado'
 ), ledger AS (
 SELECT *,count(*) OVER() AS total,${customer.balance}::float8-sum(credit) OVER() AS "openingBalance",${customer.loyaltyPoints}::float8-sum(points) OVER() AS "openingPoints",${customer.balance}::float8-sum(credit) OVER()+sum(credit) OVER(ORDER BY date,id ROWS UNBOUNDED PRECEDING) AS balance,${customer.loyaltyPoints}::float8-sum(points) OVER()+sum(points) OVER(ORDER BY date,id ROWS UNBOUNDED PRECEDING) AS "pointBalance" FROM events
 ) SELECT * FROM ledger ORDER BY date DESC,id DESC LIMIT 50 OFFSET ${(page-1)*50}`);
 return {customer:{id:customer.id,name:customer.name,phone:customer.phone,email:customer.email,balance:customer.balance,creditLimit:customer.creditLimit,loyaltyPoints:customer.loyaltyPoints},rows:rows.map(row=>({...row,date:row.date.toISOString(),total:Number(row.total)})),total:Number(rows[0]?.total??0),page,openingBalance:rows[0]?.openingBalance??customer.balance,openingPoints:rows[0]?.openingPoints??customer.loyaltyPoints};
 });
});}
export async function getStoreLogsAction(storeId:string,kind:string,page:number,from:string,to:string){return withAuthenticatedAction(async()=>{
 const user=await verifyUserRole(['Administrador']);if(user.storeId!==storeId||!Number.isInteger(page)||page<1)throw new Error('Consulta inválida.');const {start,end}=bounds(from,to);
 const models:any={audit:[prisma.auditLog,'date'],sales:[prisma.sale,'date'],cash:[prisma.cashRegisterSession,'openingTime'],movements:[prisma.cashTransaction,'date'],adjustments:[prisma.stockAdjustmentLog,'date'],entries:[prisma.stockEntryLog,'date'],changes:[prisma.productChangeLog,'date'],payables:[prisma.accountsPayable,'dateCreated'],orders:[prisma.purchaseOrder,'dateCreated']};const mapping=models[kind];if(!mapping)throw new Error('Área inválida.');const [model,field]=mapping,where={storeId,[field]:{gte:start,lt:end}};const [rows,total]=await Promise.all([model.findMany({where,take:50,skip:(page-1)*50,orderBy:[{[field]:'desc'},{id:'desc'}]}),model.count({where})]);
 return {total,page,rows:rows.map((r:any)=>({id:r.id,date:r[field].toISOString(),actor:r.userName??r.registeredByName??r.adjustedByName??r.changedByName??r.openedByName??r.cancelledByName??'—',title:r.action??r.type??r.productName??r.customerName??r.supplierName??r.description??'Caixa',details:kind==='audit'?r.details:kind==='sales'?`${r.status} · R$ ${r.total.toFixed(2)} · ${r.cancellationReason??''}`:kind==='cash'?`${r.status} · esperado R$ ${r.calculatedCashInDrawer.toFixed(2)} · informado ${r.closingBalance==null?'não encerrado':'R$ '+r.closingBalance.toFixed(2)}`:kind==='adjustments'?`${r.oldQuantity} → ${r.newQuantity} · ${r.reason} · ${r.notes??''}`:kind==='changes'?(r.changes as any[]).map(c=>`${c.field}: ${typeof c.oldValue==='object'?JSON.stringify(c.oldValue):c.oldValue} → ${typeof c.newValue==='object'?JSON.stringify(c.newValue):c.newValue}`).join('; '):kind==='entries'?`${r.totalItems} itens · R$ ${r.totalCost.toFixed(2)} · ${r.purchaseOrderId?'Pedido '+r.purchaseOrderId:''}`:kind==='movements'?`${r.description} · R$ ${r.amount.toFixed(2)}`:kind==='payables'?`${r.description} · ${r.status} · R$ ${r.amount.toFixed(2)}`:`${r.status} · R$ ${r.totalCost.toFixed(2)}`,url:kind==='sales'?'/dashboard/sales?search='+r.id:kind==='payables'?'/dashboard/accounts-payable?search='+r.id:kind==='orders'?'/dashboard/purchase-orders?search='+r.id:kind==='movements'&&r.customerId?'/dashboard/customers/'+r.customerId:undefined}))};
});}
