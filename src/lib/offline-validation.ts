import type {User} from './types';
import type {OfflineSnapshot} from './offline-projection';
export function validateOfflineOperation(kind:string,args:any[],data:OfflineSnapshot,user:User){
 const management=['addCustomer','updateCustomer','deleteCustomer','addSupplier','updateSupplier','deleteSupplier','addPayable','updatePayable','deletePayable','markPayablePaid','correctClosing','correctOpening','reopenCash','cancelOpening','saveTable','removeItem','cancelTab'];
 if(management.includes(kind)&&!['Administrador','Gerente'].includes(user.role))throw new Error('Acesso negado para esta operação.');
 if(['addProduct','updateProduct','setProductStatus','addStock','adjustStock','addPurchaseOrder','updatePurchaseOrder','receivePurchaseOrder'].includes(kind)&&!['Administrador','Gerente','Estoquista'].includes(user.role))throw new Error('Acesso negado para esta operação de estoque.');
 if(['sale','openCash','closeCash','addCashTransaction','addCreditPayment','openTab','addItem','closeTab','purchaseTickets','issueTickets','redeemTicket'].includes(kind)&&user.role==='Estoquista')throw new Error('Acesso negado para esta operação.');
 if(['saveTable','openTab','addItem','removeItem','cancelTab','closeTab','purchaseTickets','issueTickets','redeemTicket'].includes(kind)&&!user.store?.enabledModules?.includes('mesas_fichas'))throw new Error('Este módulo não está liberado para a empresa.');
 const number=(value:any,min=0)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<min)throw new Error('Informe um valor válido.');};
 const session=(id:string)=>{const s=data.cashSessions?.find((s:any)=>s.id===id);if(!s||s.status!=='Aberto')throw new Error('Abra o caixa antes de registrar a operação.');return s;};
 const product=(id:string)=>{const p=data.products?.find((p:any)=>p.id===id);if(!p)throw new Error('Produto não disponível neste dispositivo. Conecte para consultar o catálogo.');return p;};
 const payments=(rows:any[],total:number)=>{if(!rows?.length)throw new Error('Informe o pagamento.');let paid=0,cash=0;for(const row of rows){number(row.amount,0.01);paid+=Math.round(row.amount*100);if(row.method==='Dinheiro')cash+=Math.round(row.amount*100);}const change=paid-Math.round(total*100);if(change<0||change>cash)throw new Error('O pagamento deve cobrir o total; troco somente em dinheiro.');};
 if(kind==='sale'){
  session(args[1]);const sale=args[0];if(!sale.items?.length)throw new Error('Carrinho vazio.');let total=0;const ids=new Set();
  for(const item of sale.items){number(item.quantity,0.000001);const p=product(item.productId);if(ids.has(p.id))throw new Error('Produto repetido no carrinho.');ids.add(p.id);if(p.status!=='Ativo'||p.stock<item.quantity)throw new Error('Estoque insuficiente no dispositivo.');if(Math.abs(item.price-p.price)>0.001)throw new Error('Preço alterado. Atualize o carrinho.');total+=item.price*item.quantity;}
  if(Math.abs(Math.round(total*100)/100-sale.total)>0.01)throw new Error('Total da venda inválido.');payments(sale.paymentMethods,sale.total);
  const credit=sale.paymentMethods.filter((p:any)=>p.method==='Fiado').reduce((n:number,p:any)=>n+p.amount,0),points=sale.paymentMethods.filter((p:any)=>p.method==='Pontos').reduce((n:number,p:any)=>n+p.amount*10,0),customer=data.customers?.find((c:any)=>c.id===sale.customerId);
  if((credit||points)&&!customer)throw new Error('Selecione um cliente para fiado ou pontos.');
  if(customer&&(credit>customer.creditLimit-customer.balance+0.001||points>(customer.loyaltyPoints??0)))throw new Error('Limite de crédito ou pontos insuficiente.');
 }
 if(kind==='openCash'){number(args[0]);if(data.cashSessions?.some((s:any)=>s.status==='Aberto'))throw new Error('Já existe um caixa aberto.');}
 if(kind==='closeCash'){session(args[0]);number(args[1]);}
 if(kind==='addCashTransaction'){session(args[1]);number(args[0].amount,0.01);if(!['Sangria','Despesa'].includes(args[0].type))throw new Error('Movimentação inválida.');}
 if(kind==='addCreditPayment'){session(args[2]);number(args[1],0.01);const c=data.customers?.find((c:any)=>c.id===args[0]);if(!c||args[1]>c.balance)throw new Error('Pagamento superior ao saldo devedor.');}
 if(kind==='addStock'){
  if(!Array.isArray(args[0])||!args[0].length||args[0].length>200)throw new Error('Informe os itens de entrada.');
  const seen=new Set();for(const item of args[0]){if(seen.has(item.productId))throw new Error('Produto duplicado na entrada.');seen.add(item.productId);product(item.productId);number(item.quantity,0.000001);number(item.cost);}
  if(!data.suppliers?.some((s:any)=>s.id===args[1]?.id))throw new Error('Fornecedor não disponível neste dispositivo.');
 }
 if(kind==='adjustStock'){product(args[0]);number(args[1]);if(!['Perda','Avaria','Contagem','Doação','Outro'].includes(args[2]))throw new Error('Informe um motivo válido para o ajuste.');}
 if(kind==='receivePurchaseOrder'){
  const order=data.purchaseOrders?.find((r:any)=>r.id===args[0]);if(!order||['Recebido','Cancelado'].includes(order.status))throw new Error('Este pedido não aceita recebimentos.');
  if(!Array.isArray(args[1])||!args[1].length||args[1].length>500)throw new Error('Informe os itens recebidos.');
  const seen=new Set();let total=0;for(const item of args[1]){if(seen.has(item.productId))throw new Error('Produto duplicado no recebimento.');seen.add(item.productId);product(item.productId);number(item.quantityReceived);number(item.cost);const ordered=order.items.find((r:any)=>r.productId===item.productId);if(!ordered||item.quantityReceived>ordered.quantityOrdered-(ordered.quantityReceived??0))throw new Error('A quantidade recebida excede o saldo do pedido.');total+=item.quantityReceived;}if(total<=0)throw new Error('Informe pelo menos uma quantidade recebida.');
 }
 if(kind==='addItem'){const p=product(args[0].productId);number(args[0].quantity,0.000001);if(p.status!=='Ativo'||p.stock<args[0].quantity)throw new Error('Estoque insuficiente no dispositivo.');}
 if(kind==='purchaseTickets'){const p=product(args[0].productId);number(args[0].quantity,1);if(!Number.isInteger(args[0].quantity)||args[0].quantity>200||p.stock<args[0].quantity)throw new Error('Quantidade inválida ou estoque insuficiente.');session(args[0].sessionId);payments(args[0].payments,args[0].quantity*args[0].expectedPrice);}
 if(kind==='closeTab'){session(args[0].sessionId);payments(args[0].payments,args[0].totalCents/100);}
}
