import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Sale, User } from '../src/lib/types';

async function main() {
  const mainUrl = new URL(process.env.DATABASE_URL!);
  const testUrl = new URL(process.env.TEST_DATABASE_URL!);
  const target = (url: URL) => `${url.hostname}:${url.port}${url.pathname}/${url.searchParams.get('schema') ?? 'public'}`;
  if (target(mainUrl) === target(testUrl) || !testUrl.searchParams.get('schema')?.endsWith('_test')) {
    throw new Error('TEST_DATABASE_URL must identify a separate disposable schema ending in _test.');
  }
  process.env.DATABASE_URL = testUrl.toString();
  const { PrismaClient }=await import('@prisma/client');
  const fixtureUrl=new URL(process.env.TEST_DIRECT_DATABASE_URL || process.env.DIRECT_DATABASE_URL || testUrl.toString());
  fixtureUrl.searchParams.set('schema',testUrl.searchParams.get('schema')!);
  if(fixtureUrl.hostname!==testUrl.hostname || fixtureUrl.pathname!==testUrl.pathname) throw new Error('Fixtures must target the disposable database.');
  const prisma=new PrismaClient({datasourceUrl:fixtureUrl.toString(),log:[]});
  const { withDbContext }=await import('../src/lib/db');
  const { processSale: actualProcessSale } = await import('../src/lib/sales-service');
  const processSale=(sale:Omit<Sale,'id'|'date'|'status'>,sessionId:string,user:User)=>withDbContext({uid:user.uid,storeId:user.storeId,user},()=>actualProcessSale(sale,sessionId,user));
  const storeIds: string[] = [];
  const organizationIds:string[]=[];
  let passed = 0;
  const check = (name: string, verify: () => void) => { verify(); passed++; console.log(`PASS ${name}`); };
  try {
    const store = await prisma.store.create({ data: { name: `TEST-${randomUUID()}`,organization:{create:{name:'Test organization'}} } });
    const other = await prisma.store.create({ data: { name: `TEST-${randomUUID()}`, organization:{create:{name:'Test organization'}} } });
    storeIds.push(store.id, other.id);
    organizationIds.push(store.organizationId,other.organizationId);
    const user: User = { uid: randomUUID(), name: 'Test operator', email: `${randomUUID()}@test.invalid`, role: 'Administrador', storeId: store.id };
    const product = await prisma.product.create({ data: {
      name: 'Temporary test product', sku: randomUUID(), status: 'Ativo', category: 'Alimentos',
      price: 25, averageCost: 15, stock: 50, minStock: 5, unit: 'UN', supplier: '', costHistory: [], storeId: store.id,
    } });
    const customer = await prisma.customer.create({ data: { name: 'Temporary test customer', phone: '', creditLimit: 100, balance: 0, loyaltyPoints: 100, tags: ['test'], storeId: store.id } });
    const session = await prisma.cashRegisterSession.create({ data: {
      openingBalance: 100, calculatedCashInDrawer: 100, totalSales: 0, salesByPaymentMethod: { Dinheiro: 0, Pix: 0, Cartão: 0 },
      totalExpenses: 0, totalWithdrawals: 0, totalCreditPayments: 0, status: 'Aberto', openedByUid: user.uid, openedByName: user.name, storeId: store.id,
    } });
    const request = (quantity: number, payments: Sale['paymentMethods'], customerId = 'default') => ({
      items: [{ productId: product.id, productName: 'Client supplied name', quantity, price: 25 }],
      total: quantity * 25, customerId, customerName: 'Client supplied name', paymentMethods: payments,
    });
    const cashSale = await processSale(request(2, [{ method: 'Dinheiro', amount: 100 }]), session.id, user);
    const cash = await prisma.cashRegisterSession.findUniqueOrThrow({ where: { id: session.id } });
    check('cash change is removed from drawer receipts', () => { assert.equal(cash.calculatedCashInDrawer, 150); assert.equal((cashSale.paymentMethods as any[])[0].amount, 50); });
    check('product data comes from the database', () => assert.equal((cashSale.items as any[])[0].productName, product.name));
    const pointsSale = await processSale(request(2, [{ method: 'Pontos', amount: 5 }, { method: 'Dinheiro', amount: 45 }], customer.id), session.id, user);
    const updatedCustomer = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    check('loyalty points are charged and accrued in the sale transaction', () => { assert.equal(updatedCustomer.loyaltyPoints, 54); assert.equal(pointsSale.total, 50); });
    const beforeInvalid = await prisma.sale.count({ where: { storeId: store.id } });
    await assert.rejects(processSale(request(5, [{ method: 'Fiado', amount: 125 }], customer.id), session.id, user), /crédito/);
    check('credit over limit is rejected without creating a sale', () => assert.ok(true));
    await assert.rejects(processSale(request(1, [{ method: 'Pix', amount: 25 }]), session.id, user), /Pix/);
    check('unconfigured Pix cannot settle a sale', () => assert.ok(true));
    await assert.rejects(processSale(request(1, [{ method: 'Dinheiro', amount: 25 }]), session.id, { ...user, storeId: other.id }), /caixa/);
    check('another store cannot use the cash session', () => assert.ok(true));
    const tampered = request(1, [{ method: 'Dinheiro', amount: 25 }]);
    tampered.items[0].price = 1;
    await assert.rejects(processSale(tampered, session.id, user), /preço/);
    const afterInvalid = await prisma.sale.count({ where: { storeId: store.id } });
    check('invalid sales leave no rows behind', () => assert.equal(afterInvalid, beforeInvalid));
    await prisma.product.update({ where: { id: product.id }, data: { stock: 3 } });
    const concurrent = await Promise.allSettled([
      processSale(request(2, [{ method: 'Dinheiro', amount: 50 }]), session.id, user),
      processSale(request(2, [{ method: 'Dinheiro', amount: 50 }]), session.id, user),
    ]);
    const remaining = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    check('concurrent sales cannot oversell available stock', () => { assert.equal(concurrent.filter(r => r.status === 'fulfilled').length, 1); assert.equal(remaining.stock, 1); });
    await prisma.cashRegisterSession.update({ where: { id: session.id }, data: { status: 'Fechado' } });
    await assert.rejects(processSale(request(1, [{ method: 'Dinheiro', amount: 25 }]), session.id, user), /caixa/);
    check('closed cash sessions reject new sales', () => assert.ok(true));
    console.log(`${passed} integration checks passed in the disposable schema.`);
  } finally {
    try {
      const where = { storeId: { in: storeIds } };
      await prisma.$transaction([
        prisma.sale.deleteMany({ where }), prisma.cashRegisterSession.deleteMany({ where }),
        prisma.product.deleteMany({ where }), prisma.customer.deleteMany({ where }), prisma.store.deleteMany({ where: { id: { in: storeIds } } }),
        prisma.organization.deleteMany({where:{id:{in:organizationIds}}}),
      ]);
    } finally { await prisma.$disconnect(); }
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Integration checks failed.'); process.exitCode = 1; });
