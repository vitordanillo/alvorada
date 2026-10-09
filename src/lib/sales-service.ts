import { withTransaction } from './db';
import type { Sale, User } from './types';

export async function processSale(
  saleData: Omit<Sale, 'id' | 'date' | 'status'>,
  activeSessionId: string,
  user: User
) {
  if (!user.storeId) throw new Error('Selecione uma loja ativa.');
  const storeId=user.storeId;
  const clientRequestId=saleData.clientRequestId;
  if (clientRequestId && (typeof clientRequestId!=='string' || clientRequestId.length>80)) throw new Error('Identificador da venda inválido.');
  if (!Array.isArray(saleData.items) || !saleData.items.length || saleData.items.length > 200) throw new Error('Carrinho inválido.');
  if (!Array.isArray(saleData.paymentMethods) || !saleData.paymentMethods.length || saleData.paymentMethods.length > 20) throw new Error('Informe o pagamento.');
  const amounts = new Map<string, number>();
  for (const payment of saleData.paymentMethods) {
    if (!['Dinheiro', 'Cartão', 'Fiado', 'Pontos'].includes(payment.method) || !Number.isFinite(payment.amount) || payment.amount <= 0) throw new Error('Pagamento inválido. Pix requer um provedor configurado.');
    amounts.set(payment.method, (amounts.get(payment.method) ?? 0) + Math.round(payment.amount * 100));
  }
  return withTransaction(async (tx) => {
    if (clientRequestId) {
      const existing=await tx.sale.findUnique({where:{storeId_clientRequestId:{storeId,clientRequestId}}});
      if (existing) return existing;
    }
    const store=await tx.store.findUnique({where:{id:storeId}});
    if (!store || store.status!=='Ativa') throw new Error('Loja indisponível.');
    const session = await tx.cashRegisterSession.findUnique({ where: { id: activeSessionId, storeId: user.storeId } });
    if (!session || session.status !== 'Aberto') throw new Error('Abra o caixa antes de registrar a venda.');
    const productIds = saleData.items.map(item => item.productId);
    if (new Set(productIds).size !== productIds.length) throw new Error('Produto repetido no carrinho.');
    const products = await tx.product.findMany({ where: { id: { in: productIds }, storeId: user.storeId } });
    const items = saleData.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product || product.status !== 'Ativo' || !Number.isFinite(item.quantity) || item.quantity <= 0 || product.stock < item.quantity) throw new Error('Produto indisponível ou estoque insuficiente.');
      if (Math.abs(item.price - product.price) > 0.001) throw new Error('O preço do produto mudou. Atualize o carrinho.');
      return { productId: product.id, productName: product.name, quantity: item.quantity, price: product.price, costAtTimeOfSale: product.averageCost,unit:product.unit,...(product.measurement?{measurement:product.measurement as unknown as {factor:number;baseUnit:'L'|'kg'|'un'}}:{}) };
    });
    const totalCents = Math.round(items.reduce((sum, item) => sum + item.quantity * item.price, 0) * 100);
    const total = totalCents / 100;
    if (!Number.isFinite(saleData.total) || Math.abs(saleData.total - total) > 0.01 || totalCents <= 0) throw new Error('Total da venda inválido.');
    const paidCents = [...amounts.values()].reduce((sum, amount) => sum + amount, 0);
    const change = paidCents - totalCents;
    const cashCents = amounts.get('Dinheiro') ?? 0;
    if (change < 0 || change > cashCents) throw new Error('O pagamento deve cobrir o total da venda; troco somente em dinheiro.');
    const netAmounts = new Map(amounts);
    if (cashCents) netAmounts.set('Dinheiro', cashCents - change);
    const paymentMethods = [...netAmounts].filter(([, amount]) => amount > 0).map(([method, amount]) => ({ method: method as Sale['paymentMethods'][number]['method'], amount: amount / 100 }));
    const creditAmount = (netAmounts.get('Fiado') ?? 0) / 100;
    const pointsAmount = (netAmounts.get('Pontos') ?? 0) / 100;
    const customer = saleData.customerId === 'default' ? null : await tx.customer.findUnique({ where: { id: saleData.customerId, storeId: user.storeId } });
    if (saleData.customerId !== 'default' && !customer) throw new Error('Cliente não encontrado.');
    if (!customer && (creditAmount > 0 || pointsAmount > 0)) throw new Error('Selecione um cliente para fiado ou pontos.');
    if (customer && creditAmount > customer.creditLimit - customer.balance + 0.001) throw new Error('Limite de crédito excedido.');
    const pointsUsed = pointsAmount * 10;
    if (customer && pointsUsed > customer.loyaltyPoints) throw new Error('Pontos de fidelidade insuficientes.');
    const totalCost = items.reduce((sum, item) => sum + item.quantity * item.costAtTimeOfSale, 0);
    const sale = await tx.sale.create({ data: {
      items, total, totalCost, totalProfit: total - totalCost,
      customerId: customer?.id ?? 'default', customerName: customer?.name ?? 'Consumidor final',
      paymentMethods, cashRegisterSessionId: session.id, status: 'Concluída', storeId,
      clientRequestId,
      storeSnapshot:{id:store.id,name:store.name,cnpj:store.cnpj ?? '',address:store.address ?? '',phone:store.phone ?? ''},
    } });
    for (const item of items) await tx.product.update({ where: { id: item.productId, storeId: user.storeId }, data: { stock: { decrement: item.quantity } } });
    const methods = session.salesByPaymentMethod as Record<string, number>;
    await tx.cashRegisterSession.update({ where: { id: session.id, storeId: user.storeId }, data: {
      totalSales: { increment: total },
      calculatedCashInDrawer: { increment: (netAmounts.get('Dinheiro') ?? 0) / 100 },
      salesByPaymentMethod: {
        Dinheiro: (methods.Dinheiro ?? 0) + (netAmounts.get('Dinheiro') ?? 0) / 100,
        Cartão: (methods.Cartão ?? 0) + (netAmounts.get('Cartão') ?? 0) / 100,
        Pix: methods.Pix ?? 0,
      },
    } });
    if (customer) await tx.customer.update({ where: { id: customer.id, storeId: user.storeId }, data: {
      balance: { increment: creditAmount },
      loyaltyPoints: { increment: Math.floor((total - pointsAmount) * 0.1) - pointsUsed },
    } });
    return sale;
  });
}
