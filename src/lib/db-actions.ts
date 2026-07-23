'use server';

import { prisma } from './db';
import { Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import type {
  Product,
  Customer,
  Sale,
  Supplier,
  User,
  CashRegisterSession,
  CashTransaction,
  StockAdjustmentLog,
  SystemSettings,
  StockEntryLog,
  ProductChangeLog,
  AccountsPayable,
  PurchaseOrder,
} from './types';
import type { ProductFormData } from '@/components/products/product-form';
import { mockSuppliersData, mockProductsData } from './data';

// --- HELPERS & MAPPERS ---

const mapProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  sku: p.sku,
  status: p.status as 'Ativo' | 'Inativo',
  category: p.category as any,
  price: p.price,
  averageCost: p.averageCost,
  costHistory: p.costHistory as any[],
  stock: p.stock,
  minStock: p.minStock,
  unit: p.unit,
  supplier: p.supplier,
  barcode: p.barcode || undefined,
  imageUrl: p.imageUrl || undefined,
});

const mapSupplier = (s: any): Supplier => ({
  id: s.id,
  name: s.name,
  contactName: s.contactName || undefined,
  phone: s.phone || undefined,
  email: s.email || undefined,
});

const mapCustomer = (c: any): Customer => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  email: c.email || undefined,
  creditLimit: c.creditLimit,
  balance: c.balance,
  notes: c.notes || undefined,
  tags: c.tags as string[],
});

const mapSale = (s: any): Sale => ({
  id: s.id,
  date: s.date.toISOString(),
  items: s.items as any[],
  total: s.total,
  totalCost: s.totalCost || undefined,
  totalProfit: s.totalProfit || undefined,
  customerId: s.customerId,
  customerName: s.customerName,
  paymentMethods: s.paymentMethods as any[],
  cashRegisterSessionId: s.cashRegisterSessionId || undefined,
  status: s.status as 'Concluída' | 'Cancelada',
  cancellationReason: s.cancellationReason || undefined,
  cancelledBy: s.cancelledByUid && s.cancelledByName ? { uid: s.cancelledByUid, name: s.cancelledByName } : undefined,
  cancellationDate: s.cancellationDate ? s.cancellationDate.toISOString() : undefined,
});

const mapCashSession = (cs: any): CashRegisterSession => ({
  id: cs.id,
  openingTime: cs.openingTime.toISOString(),
  closingTime: cs.closingTime ? cs.closingTime.toISOString() : null,
  openingBalance: cs.openingBalance,
  closingBalance: cs.closingBalance,
  calculatedCashInDrawer: cs.calculatedCashInDrawer,
  totalSales: cs.totalSales,
  salesByPaymentMethod: cs.salesByPaymentMethod as any,
  totalExpenses: cs.totalExpenses,
  totalWithdrawals: cs.totalWithdrawals,
  totalCreditPayments: cs.totalCreditPayments,
  status: cs.status as 'Aberto' | 'Fechado',
  openedBy: { uid: cs.openedByUid, name: cs.openedByName },
  closedBy: cs.closedByUid && cs.closedByName ? { uid: cs.closedByUid, name: cs.closedByName } : null,
  correction: cs.correction as any,
  openingCorrection: cs.openingCorrection as any,
});

const mapCashTransaction = (t: any): CashTransaction => ({
  id: t.id,
  sessionId: t.sessionId,
  type: t.type as 'Despesa' | 'Sangria' | 'Recebimento Fiado',
  amount: t.amount,
  description: t.description,
  date: t.date.toISOString(),
  registeredBy: { uid: t.registeredByUid, name: t.registeredByName },
  customerId: t.customerId || undefined,
  customerName: t.customerName || undefined,
});

const mapStockAdjustmentLog = (l: any): StockAdjustmentLog => ({
  id: l.id,
  productId: l.productId,
  productName: l.productName,
  adjustedBy: { uid: l.adjustedByUid, name: l.adjustedByName },
  date: l.date.toISOString(),
  oldQuantity: l.oldQuantity,
  newQuantity: l.newQuantity,
  reason: l.reason as any,
  notes: l.notes || undefined,
});

const mapStockEntryLog = (l: any): StockEntryLog => ({
  id: l.id,
  date: l.date.toISOString(),
  supplierId: l.supplierId,
  supplierName: l.supplierName,
  items: l.items as any[],
  totalCost: l.totalCost,
  totalItems: l.totalItems,
  registeredBy: { uid: l.registeredByUid, name: l.registeredByName },
  purchaseOrderId: l.purchaseOrderId || undefined,
});

const mapProductChangeLog = (l: any): ProductChangeLog => ({
  id: l.id,
  date: l.date.toISOString(),
  productId: l.productId,
  productName: l.productName,
  changedBy: { uid: l.changedByUid, name: l.changedByName },
  changes: l.changes as any[],
});

const mapAccountsPayable = (ap: any): AccountsPayable => ({
  id: ap.id,
  description: ap.description,
  amount: ap.amount,
  dateCreated: ap.dateCreated.toISOString(),
  dueDate: ap.dueDate.toISOString(),
  paymentDate: ap.paymentDate ? ap.paymentDate.toISOString() : null,
  status: ap.status as 'Pendente' | 'Pago' | 'Vencido',
  supplierId: ap.supplierId || undefined,
  supplierName: ap.supplierName || undefined,
  registeredBy: { uid: ap.registeredByUid, name: ap.registeredByName },
  cashSessionId: ap.cashSessionId || undefined,
});

const mapPurchaseOrder = (po: any): PurchaseOrder => ({
  id: po.id,
  supplierId: po.supplierId,
  supplierName: po.supplierName,
  dateCreated: po.dateCreated.toISOString(),
  dateExpected: po.dateExpected.toISOString(),
  dateReceived: po.dateReceived ? po.dateReceived.toISOString() : undefined,
  status: po.status as any,
  items: po.items as any[],
  totalCost: po.totalCost,
  registeredBy: { uid: po.registeredByUid, name: po.registeredByName },
  notes: po.notes || undefined,
});

// --- SEED DATABASE ---

async function checkAndSeedDatabase() {
  try {
    // Ensure default store exists
    let defaultStore = await prisma.store.findFirst();
    if (!defaultStore) {
      defaultStore = await prisma.store.create({
        data: {
          name: "Loja Principal",
          cnpj: "00.000.000/0001-00",
          address: "Rua Principal, 123",
          phone: "(11) 99999-9999",
        }
      });
      console.log("Default store created:", defaultStore.name);
    }

    // Self-healing migration: Associate any legacy null-store records with the default store
    await prisma.user.updateMany({ where: { storeId: null }, data: { storeId: defaultStore.id } });
    await prisma.product.updateMany({ where: { storeId: null }, data: { storeId: defaultStore.id } });
    await prisma.supplier.updateMany({ where: { storeId: null }, data: { storeId: defaultStore.id } });
    await prisma.customer.updateMany({ where: { storeId: null }, data: { storeId: defaultStore.id } });
    await prisma.sale.updateMany({ where: { storeId: null }, data: { storeId: defaultStore.id } });
    await prisma.cashRegisterSession.updateMany({ where: { storeId: null }, data: { storeId: defaultStore.id } });
    await prisma.cashTransaction.updateMany({ where: { storeId: null }, data: { storeId: defaultStore.id } });
    await prisma.stockAdjustmentLog.updateMany({ where: { storeId: null }, data: { storeId: defaultStore.id } });
    await prisma.stockEntryLog.updateMany({ where: { storeId: null }, data: { storeId: defaultStore.id } });
    await prisma.productChangeLog.updateMany({ where: { storeId: null }, data: { storeId: defaultStore.id } });
    await prisma.accountsPayable.updateMany({ where: { storeId: null }, data: { storeId: defaultStore.id } });
    await prisma.purchaseOrder.updateMany({ where: { storeId: null }, data: { storeId: defaultStore.id } });

    const seedFlag = await prisma.systemConfig.findUnique({ where: { key: 'flags' } });
    const isSeeded = seedFlag ? (seedFlag.value as any)?.seeded_v2 : false;

    if (!isSeeded) {
      console.log("MySQL/MariaDB needs to be seeded/updated. Running seed function...");
      
      // Seeding users
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        const hashedAdminPassword = bcrypt.hashSync('123456', 10);
        await prisma.user.create({
          data: {
            uid: 'admin-default-uid',
            name: 'Administrador Alvorada',
            email: 'admin@alvorada.com',
            passwordHash: hashedAdminPassword,
            role: 'Administrador',
            storeId: defaultStore.id,
          }
        });
        console.log("Default admin created: admin@alvorada.com / 123456");
      }

      // Seed suppliers
      for (const supplier of mockSuppliersData) {
        const existing = await prisma.supplier.findFirst({ where: { name: supplier.name } });
        if (!existing) {
          await prisma.supplier.create({
            data: {
              name: supplier.name,
              contactName: supplier.contactName || null,
              phone: supplier.phone || null,
              email: supplier.email || null,
              storeId: defaultStore.id,
            }
          });
        }
      }

      // Seed products
      let skuCounter = 0;
      for (const product of mockProductsData) {
        skuCounter++;
        const existing = await prisma.product.findFirst({ where: { name: product.name } });
        if (!existing) {
          await prisma.product.create({
            data: {
              name: product.name,
              sku: String(skuCounter),
              status: 'Ativo',
              category: product.category,
              price: product.price,
              averageCost: product.averageCost,
              costHistory: product.costHistory,
              stock: product.stock,
              minStock: product.minStock,
              unit: product.unit,
              supplier: product.supplier,
              barcode: product.barcode || null,
              imageUrl: product.imageUrl || null,
              storeId: defaultStore.id,
            }
          });
        }
      }

      // Initialize counter & config
      await prisma.systemConfig.upsert({
        where: { key: 'products_counter' },
        update: { value: { lastSku: skuCounter } },
        create: { key: 'products_counter', value: { lastSku: skuCounter } },
      });

      await prisma.systemConfig.upsert({
        where: { key: 'config' },
        update: { value: { cancellationPassword: '1234' } },
        create: { key: 'config', value: { cancellationPassword: '1234' } },
      });

      // Mark as seeded
      await prisma.systemConfig.upsert({
        where: { key: 'flags' },
        update: { value: { seeded_v2: true } },
        create: { key: 'flags', value: { seeded_v2: true } },
      });

      console.log("MySQL/MariaDB seeded successfully.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

async function getAuthenticatedUser(): Promise<User> {
  const cookieStore = await cookies();
  const token = cookieStore.get('firebase-auth-token')?.value;
  if (!token) throw new Error("Usuário não autenticado.");

  const user = await prisma.user.findUnique({ where: { uid: token } });
  if (!user) throw new Error("Usuário não encontrado.");

  return {
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: user.role as any,
    avatarUrl: user.avatarUrl || undefined,
    storeId: user.storeId || undefined,
  };
}

async function verifyUserRole(allowedRoles: User['role'][]): Promise<User> {
  const user = await getAuthenticatedUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Acesso negado: privilégios insuficientes.");
  }
  return user;
}

// --- AUTHENTICATION ACTIONS ---

export async function getCurrentUserAction(): Promise<User | null> {
  await checkAndSeedDatabase();
  
  const cookieStore = await cookies();
  const token = cookieStore.get('firebase-auth-token')?.value;
  if (!token) return null;

  try {
    const user = await prisma.user.findUnique({ where: { uid: token } });
    if (!user) return null;

    return {
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role as any,
      avatarUrl: user.avatarUrl || undefined,
      storeId: user.storeId || undefined,
    };
  } catch (err) {
    console.error("Error getting current user:", err);
    return null;
  }
}

export async function loginUserAction(email: string, password: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("E-mail ou senha inválidos.");

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) throw new Error("E-mail ou senha inválidos.");

  const cookieStore = await cookies();
  cookieStore.set('firebase-auth-token', user.uid, {
    path: '/',
    httpOnly: false, // Accessible by client middleware/script
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return {
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: user.role as any,
    avatarUrl: user.avatarUrl || undefined,
  };
}

export async function registerUserAction(name: string, email: string, password: string): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("E-mail já está em uso.");

  const userCount = await prisma.user.count();
  const defaultRole = userCount === 0 ? 'Administrador' : 'Operador de Caixa';

  const uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const passwordHash = bcrypt.hashSync(password, 10);

  const user = await prisma.user.create({
    data: {
      uid,
      name,
      email,
      passwordHash,
      role: defaultRole,
    }
  });

  const cookieStore = await cookies();
  cookieStore.set('firebase-auth-token', user.uid, {
    path: '/',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
  });

  return {
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: user.role as any,
    avatarUrl: user.avatarUrl || undefined,
  };
}

export async function logoutUserAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('firebase-auth-token');
}

export async function updateUserRoleAction(uid: string, role: User['role']): Promise<void> {
  const user = await verifyUserRole(['Administrador']);
  const targetUser = await prisma.user.findUnique({ where: { uid } });
  await prisma.user.update({
    where: { uid },
    data: { role },
  });
  await logAuditEvent('Alterar Cargo de Usuário', `Cargo do usuário ${targetUser?.name || uid} alterado de ${targetUser?.role} para ${role} por ${user.name}`);
}

// --- INITIAL DATA FETCH ACTION ---

export async function getInitialDataAction() {
  const user = await getAuthenticatedUser();
  const role = user.role;
  const storeFilter = { storeId: user.storeId };

  const productsPromise = prisma.product.findMany({ where: storeFilter });
  const customersPromise = prisma.customer.findMany({ where: storeFilter });
  const salesPromise = prisma.sale.findMany({ where: storeFilter, orderBy: { date: 'desc' } });
  const suppliersPromise = prisma.supplier.findMany({ where: storeFilter });
  const cashSessionsPromise = prisma.cashRegisterSession.findMany({ where: storeFilter, orderBy: { openingTime: 'desc' } });
  const stockAdjustmentLogsPromise = prisma.stockAdjustmentLog.findMany({ where: storeFilter, orderBy: { date: 'desc' } });

  const isManagement = role === 'Administrador' || role === 'Gerente';

  const [products, customers, sales, suppliers, cashSessions, stockAdjustmentLogs] = await Promise.all([
    productsPromise,
    customersPromise,
    salesPromise,
    suppliersPromise,
    cashSessionsPromise,
    stockAdjustmentLogsPromise,
  ]);

  let allUsers: User[] = [];
  let systemSettings: SystemSettings | null = null;
  let stockEntryLogs: StockEntryLog[] = [];
  let productChangeLogs: ProductChangeLog[] = [];
  let accountsPayable: AccountsPayable[] = [];
  let purchaseOrders: PurchaseOrder[] = [];

  if (isManagement) {
    const promises: Promise<any>[] = [
      prisma.stockEntryLog.findMany({ where: storeFilter, orderBy: { date: 'desc' } }),
      prisma.productChangeLog.findMany({ where: storeFilter, orderBy: { date: 'desc' } }),
      prisma.accountsPayable.findMany({ where: storeFilter, orderBy: { dueDate: 'asc' } }),
      prisma.purchaseOrder.findMany({ where: storeFilter, orderBy: { dateCreated: 'desc' } }),
    ];

    if (role === 'Administrador') {
      promises.push(prisma.user.findMany({ where: storeFilter }));
      promises.push(prisma.systemConfig.findUnique({ where: { key: 'config' } }));
    }

    const results = await Promise.all(promises);
    stockEntryLogs = results[0].map(mapStockEntryLog);
    productChangeLogs = results[1].map(mapProductChangeLog);
    accountsPayable = results[2].map(mapAccountsPayable);
    purchaseOrders = results[3].map(mapPurchaseOrder);

    if (role === 'Administrador') {
      allUsers = results[4].map((u: any) => ({
        uid: u.uid,
        name: u.name,
        email: u.email,
        role: u.role as any,
        avatarUrl: u.avatarUrl || undefined,
      }));
      systemSettings = results[5] ? (results[5].value as SystemSettings) : null;
    }
  }

  return {
    products: products.map(mapProduct),
    customers: customers.map(mapCustomer),
    sales: sales.map(mapSale),
    suppliers: suppliers.map(mapSupplier),
    cashSessions: cashSessions.map(mapCashSession),
    stockAdjustmentLogs: stockAdjustmentLogs.map(mapStockAdjustmentLog),
    allUsers,
    systemSettings,
    stockEntryLogs,
    productChangeLogs,
    accountsPayable,
    purchaseOrders,
  };
}

export async function getPaymentHistoryAction(customerId: string): Promise<CashTransaction[]> {
  const transactions = await prisma.cashTransaction.findMany({
    where: {
      customerId,
      type: 'Recebimento Fiado',
    },
    orderBy: {
      date: 'desc',
    },
  });

  return transactions.map(mapCashTransaction);
}

export async function getCashTransactionsAction(sessionId: string): Promise<CashTransaction[]> {
  const transactions = await prisma.cashTransaction.findMany({
    where: { sessionId },
    orderBy: { date: 'desc' },
  });
  return transactions.map(mapCashTransaction);
}

// --- CRUD OPERATIONS ---

// Products
export async function addProductAction(productData: ProductFormData): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Estoquista']);
  const counterKey = 'products_counter';
  
  await prisma.$transaction(async (tx) => {
    const counterDoc = await tx.systemConfig.findUnique({ where: { key: counterKey } });
    let newSkuNumber = 1;
    if (counterDoc && counterDoc.value) {
      newSkuNumber = ((counterDoc.value as any).lastSku || 0) + 1;
    }

    const newSku = String(newSkuNumber);

    await tx.product.create({
      data: {
        name: productData.name,
        sku: newSku,
        status: 'Ativo',
        category: productData.category,
        price: productData.price,
        averageCost: 0,
        costHistory: [],
        stock: productData.stock,
        minStock: productData.minStock,
        unit: productData.unit,
        supplier: productData.supplier,
        barcode: productData.barcode || null,
        imageUrl: (productData as any).imageUrl || null,
        storeId: user.storeId,
      }
    });

    await tx.systemConfig.upsert({
      where: { key: counterKey },
      update: { value: { lastSku: newSkuNumber } },
      create: { key: counterKey, value: { lastSku: newSkuNumber } },
    });
  });
}

export async function updateProductAction(updatedProductData: Product): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Estoquista']);
  const { id, ...data } = updatedProductData;

  await prisma.$transaction(async (tx) => {
    const oldProduct = await tx.product.findUnique({ where: { id } });
    if (!oldProduct) throw new Error("Produto não encontrado.");

    const changes: any[] = [];
    const fieldsToLog: (keyof Product)[] = ['name', 'price', 'category', 'supplier', 'minStock', 'unit', 'barcode'];

    fieldsToLog.forEach(field => {
      const oldValue = (oldProduct as any)[field];
      const newValue = (data as any)[field];
      if (oldValue !== newValue) {
        changes.push({
          field: String(field),
          oldValue,
          newValue,
        });
      }
    });

    await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        price: data.price,
        minStock: data.minStock,
        unit: data.unit,
        supplier: data.supplier,
        barcode: data.barcode || null,
        imageUrl: data.imageUrl || null,
      },
    });

    if (changes.length > 0) {
      await tx.productChangeLog.create({
        data: {
          productId: id,
          productName: data.name,
          changedByUid: user.uid,
          changedByName: user.name,
          changes,
          storeId: user.storeId,
        }
      });
    }
  });
}

export async function setProductStatusAction(productId: string, status: 'Ativo' | 'Inativo'): Promise<void> {
  await verifyUserRole(['Administrador', 'Gerente', 'Estoquista']);
  await prisma.product.update({
    where: { id: productId },
    data: { status },
  });
}

export async function addStockToProductsAction(
  items: { productId: string; quantity: number; cost: number }[],
  supplier: { id: string; name: string }
): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Estoquista']);
  const productDetails = [];

  for (const item of items) {
    if (item.quantity <= 0 || item.cost < 0) continue;

    const product = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.findUnique({ where: { id: item.productId } });
      if (!prod) throw new Error(`Produto com id ${item.productId} não encontrado.`);

      const newHistoryEntry = {
        date: new Date().toISOString(),
        quantity: item.quantity,
        cost: item.cost,
      };

      let updatedCostHistory = [...((prod.costHistory as any[]) || []), newHistoryEntry];
      if (updatedCostHistory.length > 10) {
        updatedCostHistory = updatedCostHistory.slice(-10);
      }

      const totalCostInHistory = updatedCostHistory.reduce((acc, entry) => acc + (entry.cost * entry.quantity), 0);
      const totalQuantityInHistory = updatedCostHistory.reduce((acc, entry) => acc + entry.quantity, 0);
      const newAverageCost = totalQuantityInHistory > 0 ? totalCostInHistory / totalQuantityInHistory : 0;

      const updated = await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          costHistory: updatedCostHistory,
          averageCost: newAverageCost,
        }
      });
      return updated;
    });

    productDetails.push({
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      cost: item.cost,
    });
  }

  const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (productDetails.length > 0) {
    await prisma.stockEntryLog.create({
      data: {
        supplierId: supplier.id,
        supplierName: supplier.name,
        items: productDetails,
        totalCost,
        totalItems,
        registeredByUid: user.uid,
        registeredByName: user.name,
        storeId: user.storeId,
      }
    });
  }
}

export async function adjustStockAction(
  productId: string,
  newQuantity: number,
  reason: StockAdjustmentLog['reason'],
  notes: string
): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Estoquista']);
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Produto não encontrado.");

    await tx.stockAdjustmentLog.create({
      data: {
        productId,
        productName: product.name,
        adjustedByUid: user.uid,
        adjustedByName: user.name,
        oldQuantity: product.stock,
        newQuantity,
        reason,
        notes: notes || null,
        storeId: user.storeId,
      }
    });

    await tx.product.update({
      where: { id: productId },
      data: { stock: newQuantity },
    });
  });
}

// Customers
export async function addCustomerAction(customerData: Omit<Customer, 'id' | 'balance'>): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente']);
  await prisma.customer.create({
    data: {
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email || null,
      creditLimit: customerData.creditLimit,
      balance: 0,
      notes: customerData.notes || null,
      tags: customerData.tags || [],
      storeId: user.storeId,
    }
  });
}

export async function updateCustomerAction(updatedCustomer: Customer): Promise<void> {
  await verifyUserRole(['Administrador', 'Gerente']);
  const { id, ...data } = updatedCustomer;
  await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      creditLimit: data.creditLimit,
      notes: data.notes || null,
      tags: data.tags || [],
    }
  });
}

export async function deleteCustomerAction(customerId: string): Promise<void> {
  await verifyUserRole(['Administrador', 'Gerente']);
  await prisma.customer.delete({ where: { id: customerId } });
}

export async function addCreditPaymentAction(
  customerId: string,
  amount: number,
  activeSessionId: string
): Promise<CashTransaction> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Operador de Caixa']);
  return await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error("Cliente não encontrado.");

    await tx.customer.update({
      where: { id: customerId },
      data: { balance: { increment: -amount } },
    });

    await tx.cashRegisterSession.update({
      where: { id: activeSessionId },
      data: {
        calculatedCashInDrawer: { increment: amount },
        totalCreditPayments: { increment: amount },
      }
    });

    const newTransaction = await tx.cashTransaction.create({
      data: {
        sessionId: activeSessionId,
        type: 'Recebimento Fiado',
        amount,
        description: `Pagamento recebido de ${customer.name}`,
        registeredByUid: user.uid,
        registeredByName: user.name,
        customerId,
        customerName: customer.name,
        storeId: user.storeId,
      }
    });

    return mapCashTransaction(newTransaction);
  });
}

// Sales
export async function addSaleAction(
  saleData: Omit<Sale, 'id' | 'date' | 'status'>,
  activeSessionId: string
): Promise<Sale> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Operador de Caixa']);
  return await prisma.$transaction(async (tx) => {
    const productIds = saleData.items.map(i => i.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });

    const itemsWithCost = [];
    let totalCost = 0;

    for (const item of saleData.items) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod || prod.stock < item.quantity) {
        throw new Error(`Estoque insuficiente para o produto ${item.productName}`);
      }
      const costAtTimeOfSale = prod.averageCost || 0;
      itemsWithCost.push({ ...item, costAtTimeOfSale });
      totalCost += costAtTimeOfSale * item.quantity;
    }

    const totalProfit = saleData.total - totalCost;

    const sale = await tx.sale.create({
      data: {
        items: itemsWithCost,
        total: saleData.total,
        totalCost,
        totalProfit,
        customerId: saleData.customerId,
        customerName: saleData.customerName,
        paymentMethods: saleData.paymentMethods,
        cashRegisterSessionId: activeSessionId,
        status: 'Concluída',
        storeId: user.storeId,
      }
    });

    // Update stocks
    for (const item of saleData.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Update Cash Session
    const sessionUpdate: any = { totalSales: { increment: saleData.total } };
    let fiadoAmount = 0;

    const salesByPaymentMethod: any = {};

    for (const payment of saleData.paymentMethods) {
      if (payment.method === 'Dinheiro') {
        sessionUpdate.calculatedCashInDrawer = { increment: payment.amount };
        salesByPaymentMethod['Dinheiro'] = payment.amount;
      } else if (payment.method === 'Cartão') {
        salesByPaymentMethod['Cartão'] = payment.amount;
      } else if (payment.method === 'Pix') {
        salesByPaymentMethod['Pix'] = payment.amount;
      } else if (payment.method === 'Fiado') {
        fiadoAmount = payment.amount;
      }
    }

    // Since we store salesByPaymentMethod as a JSON column in session, we need to load and merge it
    const session = await tx.cashRegisterSession.findUnique({ where: { id: activeSessionId } });
    if (session) {
      const currentMethods = (session.salesByPaymentMethod as any) || { Dinheiro: 0, Pix: 0, Cartão: 0 };
      const mergedMethods = {
        Dinheiro: (currentMethods.Dinheiro || 0) + (salesByPaymentMethod['Dinheiro'] || 0),
        Pix: (currentMethods.Pix || 0) + (salesByPaymentMethod['Pix'] || 0),
        Cartão: (currentMethods.Cartão || 0) + (salesByPaymentMethod['Cartão'] || 0),
      };
      sessionUpdate.salesByPaymentMethod = mergedMethods;
    }

    await tx.cashRegisterSession.update({
      where: { id: activeSessionId },
      data: sessionUpdate,
    });

    let pointsUsed = 0;
    for (const payment of saleData.paymentMethods) {
      if (payment.method === 'Pontos') {
        pointsUsed += payment.amount * 10; // R$ 1,00 = 10 pontos
      }
    }

    if (pointsUsed > 0 && saleData.customerId !== 'default') {
      const customer = await tx.customer.findUnique({ where: { id: saleData.customerId } });
      if (!customer) throw new Error("Cliente não encontrado.");
      if ((customer.loyaltyPoints || 0) < pointsUsed) {
        throw new Error(`Pontos de fidelidade insuficientes. Necessário: ${pointsUsed}, Disponível: ${customer.loyaltyPoints || 0}`);
      }
      await tx.customer.update({
        where: { id: saleData.customerId },
        data: { loyaltyPoints: { decrement: pointsUsed } },
      });
    }

    // Accumulate points for new purchase (excluding any portion paid with points)
    let cashOrCardTotal = saleData.total;
    for (const payment of saleData.paymentMethods) {
      if (payment.method === 'Pontos') {
        cashOrCardTotal -= payment.amount;
      }
    }
    if (cashOrCardTotal > 0 && saleData.customerId !== 'default') {
      const pointsEarned = Math.floor(cashOrCardTotal * 0.1); // 1 ponto por R$ 10,00 gastos
      if (pointsEarned > 0) {
        await tx.customer.update({
          where: { id: saleData.customerId },
          data: { loyaltyPoints: { increment: pointsEarned } },
        });
      }
    }

    if (fiadoAmount > 0 && saleData.customerId !== 'default') {
      const customer = await tx.customer.findUnique({ where: { id: saleData.customerId } });
      if (!customer) throw new Error("Cliente não encontrado.");

      const availableCredit = customer.creditLimit - customer.balance;
      if (fiadoAmount > availableCredit) {
        throw new Error(`Limite de crédito excedido para o cliente ${customer.name}. Limite disponível: R$ ${availableCredit.toFixed(2)}`);
      }

      await tx.customer.update({
        where: { id: saleData.customerId },
        data: { balance: { increment: fiadoAmount } },
      });
    }

    return mapSale(sale);
  });
}

export async function cancelSaleAction(
  saleId: string,
  reason: string,
  passwordAttempt: string
): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente']);
  const configDoc = await prisma.systemConfig.findUnique({ where: { key: 'config' } });
  const currentPassword = (configDoc?.value as any)?.cancellationPassword || '1234';
  if (passwordAttempt !== currentPassword) throw new Error("Senha de cancelamento incorreta.");

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id: saleId } });
    if (!sale) throw new Error("Venda não encontrada.");
    if (sale.status === 'Cancelada') throw new Error("Esta venda já foi cancelada.");

    // Restore stock
    const items = sale.items as any[];
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    // Update cash session if applicable
    if (sale.cashRegisterSessionId) {
      const sessionUpdate: any = { totalSales: { decrement: sale.total } };
      let fiadoAmount = 0;
      let pointsAmount = 0;
      const decPaymentMethods: any = {};

      const pMethods = sale.paymentMethods as any[];
      for (const payment of pMethods) {
        if (payment.method === 'Dinheiro') {
          sessionUpdate.calculatedCashInDrawer = { decrement: payment.amount };
          decPaymentMethods['Dinheiro'] = payment.amount;
        } else if (payment.method === 'Cartão') {
          decPaymentMethods['Cartão'] = payment.amount;
        } else if (payment.method === 'Pix') {
          decPaymentMethods['Pix'] = payment.amount;
        } else if (payment.method === 'Fiado' && sale.customerId !== 'default') {
          fiadoAmount = payment.amount;
        } else if (payment.method === 'Pontos' && sale.customerId !== 'default') {
          pointsAmount = payment.amount;
        }
      }

      const session = await tx.cashRegisterSession.findUnique({ where: { id: sale.cashRegisterSessionId } });
      if (session) {
        const currentMethods = (session.salesByPaymentMethod as any) || { Dinheiro: 0, Pix: 0, Cartão: 0 };
        const mergedMethods = {
          Dinheiro: (currentMethods.Dinheiro || 0) - (decPaymentMethods['Dinheiro'] || 0),
          Pix: (currentMethods.Pix || 0) - (decPaymentMethods['Pix'] || 0),
          Cartão: (currentMethods.Cartão || 0) - (decPaymentMethods['Cartão'] || 0),
        };
        sessionUpdate.salesByPaymentMethod = mergedMethods;
      }

      await tx.cashRegisterSession.update({
        where: { id: sale.cashRegisterSessionId },
        data: sessionUpdate,
      });

      if (fiadoAmount > 0 && sale.customerId !== 'default') {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: { balance: { decrement: fiadoAmount } },
        });
      }

      // Rollback loyalty points
      if (sale.customerId !== 'default') {
        // 1. Give back points used to pay
        if (pointsAmount > 0) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: { loyaltyPoints: { increment: pointsAmount * 10 } },
          });
        }
        // 2. Subtract points earned during this purchase
        let cashOrCardTotal = sale.total;
        for (const payment of pMethods) {
          if (payment.method === 'Pontos') {
            cashOrCardTotal -= payment.amount;
          }
        }
        if (cashOrCardTotal > 0) {
          const pointsEarned = Math.floor(cashOrCardTotal * 0.1);
          if (pointsEarned > 0) {
            await tx.customer.update({
              where: { id: sale.customerId },
              data: { loyaltyPoints: { decrement: pointsEarned } },
            });
          }
        }
      }
    }

    await tx.sale.update({
      where: { id: saleId },
      data: {
        status: 'Cancelada',
        cancellationReason: reason,
        cancellationDate: new Date(),
        cancelledByUid: user.uid,
        cancelledByName: user.name,
      }
    });

    await logAuditEvent('Cancelamento de Venda', `Venda #${saleId.substring(0, 8)} cancelada por ${user.name}. Motivo: ${reason}`);
  });
}

// Cash Registers
export async function openCashRegisterAction(openingBalance: number): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Operador de Caixa']);
  const activeSession = await prisma.cashRegisterSession.findFirst({ where: { status: 'Aberto', storeId: user.storeId } });
  if (activeSession) throw new Error("Já existe um caixa aberto.");

  await prisma.cashRegisterSession.create({
    data: {
      openingTime: new Date(),
      closingTime: null,
      openingBalance,
      closingBalance: null,
      calculatedCashInDrawer: openingBalance,
      totalSales: 0,
      salesByPaymentMethod: { Dinheiro: 0, Pix: 0, Cartão: 0 },
      totalExpenses: 0,
      totalWithdrawals: 0,
      totalCreditPayments: 0,
      status: 'Aberto',
      openedByUid: user.uid,
      openedByName: user.name,
      storeId: user.storeId,
    }
  });

  await logAuditEvent('Abertura de Caixa', `Caixa aberto com saldo inicial de R$ ${openingBalance.toFixed(2)} por ${user.name}`);
}

export async function closeCashRegisterAction(sessionId: string, closingBalance: number): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Operador de Caixa']);
  await prisma.cashRegisterSession.update({
    where: { id: sessionId },
    data: {
      status: 'Fechado',
      closingTime: new Date(),
      closingBalance,
      closedByUid: user.uid,
      closedByName: user.name,
    }
  });

  await logAuditEvent('Fechamento de Caixa', `Caixa fechado com saldo informado de R$ ${closingBalance.toFixed(2)} por ${user.name}`);
}

export async function correctCashClosingAction(sessionId: string, newClosingBalance: number): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Operador de Caixa']);
  const session = await prisma.cashRegisterSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Sessão não encontrada");

  const oldClosingBalance = session.closingBalance || 0;

  await prisma.cashRegisterSession.update({
    where: { id: sessionId },
    data: {
      closingBalance: newClosingBalance,
      correction: {
        date: new Date().toISOString(),
        user: { uid: user.uid, name: user.name },
        oldValue: oldClosingBalance,
        newValue: newClosingBalance
      }
    }
  });

  await logAuditEvent('Correção de Saldo de Fechamento', `Saldo de fechamento corrigido de R$ ${oldClosingBalance.toFixed(2)} para R$ ${newClosingBalance.toFixed(2)} por ${user.name}`);
}

export async function correctOpeningBalanceAction(sessionId: string, newOpeningBalance: number): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Operador de Caixa']);
  await prisma.$transaction(async (tx) => {
    const session = await tx.cashRegisterSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error("Sessão de caixa não encontrada.");

    const difference = newOpeningBalance - session.openingBalance;

    await tx.cashRegisterSession.update({
      where: { id: sessionId },
      data: {
        openingBalance: newOpeningBalance,
        calculatedCashInDrawer: { increment: difference },
        openingCorrection: {
          date: new Date().toISOString(),
          user: { uid: user.uid, name: user.name },
          oldValue: session.openingBalance,
          newValue: newOpeningBalance
        }
      }
    });

    await logAuditEvent('Correção de Saldo de Abertura', `Saldo de abertura corrigido de R$ ${session.openingBalance.toFixed(2)} para R$ ${newOpeningBalance.toFixed(2)} por ${user.name}`);
  });
}

export async function reopenCashRegisterAction(sessionId: string): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente']);
  const activeSession = await prisma.cashRegisterSession.findFirst({ where: { status: 'Aberto', storeId: user.storeId } });
  if (activeSession) throw new Error("Não é possível reabrir um caixa enquanto outro já está ativo.");

  await prisma.cashRegisterSession.update({
    where: { id: sessionId },
    data: {
      status: 'Aberto',
      closingTime: null,
      closingBalance: null,
      closedByUid: null,
      closedByName: null,
      correction: Prisma.DbNull,
    }
  });

  await logAuditEvent('Reabertura de Caixa', `Sessão de caixa reaberta por ${user.name}`);
}

export async function cancelCashRegisterOpeningAction(sessionId: string): Promise<void> {
  await verifyUserRole(['Administrador', 'Gerente']);
  await prisma.$transaction(async (tx) => {
    const session = await tx.cashRegisterSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error("Sessão de caixa não encontrada.");

    const hasTransactions = session.totalSales > 0 || session.totalExpenses > 0 || session.totalWithdrawals > 0 || session.totalCreditPayments > 0;
    if (hasTransactions) throw new Error("Não é possível cancelar. O caixa já possui movimentações.");

    await tx.cashRegisterSession.delete({ where: { id: sessionId } });
  });
}

export async function addCashTransactionAction(
  transactionData: Omit<CashTransaction, 'id' | 'date' | 'sessionId' | 'registeredBy'>,
  activeSessionId: string
): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Operador de Caixa']);
  await prisma.$transaction(async (tx) => {
    await tx.cashTransaction.create({
      data: {
        sessionId: activeSessionId,
        type: transactionData.type,
        amount: transactionData.amount,
        description: transactionData.description,
        registeredByUid: user.uid,
        registeredByName: user.name,
        storeId: user.storeId,
      }
    });

    const updatePayload: any = { calculatedCashInDrawer: { decrement: transactionData.amount } };
    if (transactionData.type === 'Despesa') {
      updatePayload.totalExpenses = { increment: transactionData.amount };
    } else if (transactionData.type === 'Sangria') {
      updatePayload.totalWithdrawals = { increment: transactionData.amount };
    }

    await tx.cashRegisterSession.update({
      where: { id: activeSessionId },
      data: updatePayload,
    });
  });
}

// Suppliers
export async function addSupplierAction(supplierData: Omit<Supplier, 'id'>): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente']);
  await prisma.supplier.create({
    data: {
      name: supplierData.name,
      contactName: supplierData.contactName || null,
      phone: supplierData.phone || null,
      email: supplierData.email || null,
      storeId: user.storeId,
    }
  });
}

export async function updateSupplierAction(updatedSupplier: Supplier): Promise<void> {
  await verifyUserRole(['Administrador', 'Gerente']);
  const { id, ...data } = updatedSupplier;
  await prisma.supplier.update({
    where: { id },
    data: {
      name: data.name,
      contactName: data.contactName || null,
      phone: data.phone || null,
      email: data.email || null,
    }
  });
}

export async function deleteSupplierAction(supplierId: string): Promise<void> {
  await verifyUserRole(['Administrador', 'Gerente']);
  await prisma.supplier.delete({ where: { id: supplierId } });
}

export async function updateCancellationPasswordAction(newPassword: string): Promise<void> {
  const user = await verifyUserRole(['Administrador']);
  await prisma.systemConfig.upsert({
    where: { key: 'config' },
    update: { value: { cancellationPassword: newPassword } },
    create: { key: 'config', value: { cancellationPassword: newPassword } },
  });
  await logAuditEvent('Alterar Senha de Cancelamento', `Senha de cancelamento de vendas alterada por ${user.name}`);
}

// Accounts Payable
export async function addPayableAction(
  payableData: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>
): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente']);
  await prisma.accountsPayable.create({
    data: {
      description: payableData.description,
      amount: payableData.amount,
      dueDate: new Date(payableData.dueDate),
      status: 'Pendente',
      supplierId: payableData.supplierId || null,
      supplierName: payableData.supplierName || null,
      registeredByUid: user.uid,
      registeredByName: user.name,
      storeId: user.storeId,
    }
  });
}

export async function updatePayableAction(
  payableId: string,
  data: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>
): Promise<void> {
  await verifyUserRole(['Administrador', 'Gerente']);
  await prisma.accountsPayable.update({
    where: { id: payableId },
    data: {
      description: data.description,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      supplierId: data.supplierId || null,
      supplierName: data.supplierName || null,
    }
  });
}

export async function deletePayableAction(payableId: string): Promise<void> {
  await verifyUserRole(['Administrador', 'Gerente']);
  await prisma.accountsPayable.delete({ where: { id: payableId } });
}

export async function markPayableAsPaidAction(
  payableId: string,
  fromCashRegister: boolean,
  activeSessionId: string | null
): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente']);
  await prisma.$transaction(async (tx) => {
    const payable = await tx.accountsPayable.findUnique({ where: { id: payableId } });
    if (!payable) throw new Error("Conta a pagar não encontrada.");

    if (fromCashRegister) {
      if (!activeSessionId) throw new Error("Não há caixa aberto para registrar o pagamento.");

      await tx.cashTransaction.create({
        data: {
          sessionId: activeSessionId,
          type: 'Despesa',
          amount: payable.amount,
          description: `Pagamento: ${payable.description}`,
          registeredByUid: user.uid,
          registeredByName: user.name,
          storeId: user.storeId,
        }
      });

      await tx.cashRegisterSession.update({
        where: { id: activeSessionId },
        data: {
          calculatedCashInDrawer: { decrement: payable.amount },
          totalExpenses: { increment: payable.amount },
        }
      });
    }

    await tx.accountsPayable.update({
      where: { id: payableId },
      data: {
        status: 'Pago',
        paymentDate: new Date(),
        cashSessionId: fromCashRegister ? activeSessionId : null,
      }
    });
  });
}

// Purchase Orders
export async function addPurchaseOrderAction(
  orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy'>
): Promise<string> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Estoquista']);
  const newOrder = await prisma.purchaseOrder.create({
    data: {
      supplierId: orderData.supplierId,
      supplierName: orderData.supplierName,
      dateExpected: new Date(orderData.dateExpected),
      status: 'Pendente',
      items: orderData.items.map(item => ({ ...item, quantityReceived: 0 })),
      totalCost: orderData.totalCost,
      registeredByUid: user.uid,
      registeredByName: user.name,
      notes: orderData.notes || null,
      storeId: user.storeId,
    }
  });
  return newOrder.id;
}

export async function updatePurchaseOrderAction(
  orderId: string,
  orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy' | 'items' | 'totalCost'> & { items: any; totalCost: any }
): Promise<void> {
  await verifyUserRole(['Administrador', 'Gerente', 'Estoquista']);
  await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: {
      supplierId: orderData.supplierId,
      supplierName: orderData.supplierName,
      dateExpected: new Date(orderData.dateExpected),
      items: orderData.items,
      totalCost: orderData.totalCost,
      notes: orderData.notes || null,
    }
  });
}

export async function receivePurchaseOrderAction(
  orderId: string,
  receivedItems: { productId: string; productName: string; quantityReceived: number; cost: number }[]
): Promise<void> {
  const user = await verifyUserRole(['Administrador', 'Gerente', 'Estoquista']);
  await prisma.$transaction(async (tx) => {
    // --- 1. READ PHASE ---
    const order = await tx.purchaseOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Pedido de compra não encontrado.");

    const validReceivedItems = receivedItems.filter(item => item.quantityReceived > 0);
    const productIds = validReceivedItems.map(item => item.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });

    // --- 2. VALIDATION & PREPARATION ---
    const productsData: { [id: string]: any } = {};
    for (const item of validReceivedItems) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        throw new Error(`Produto ${item.productName} não encontrado.`);
      }
      productsData[prod.id] = prod;
    }

    // --- 3. WRITE PHASE ---

    // Update products (stock and cost)
    for (const receivedItem of validReceivedItems) {
      const prod = productsData[receivedItem.productId];
      const newHistoryEntry = {
        date: new Date().toISOString(),
        quantity: receivedItem.quantityReceived,
        cost: receivedItem.cost
      };
      
      let updatedCostHistory = [...((prod.costHistory as any[]) || []), newHistoryEntry];
      if (updatedCostHistory.length > 10) updatedCostHistory = updatedCostHistory.slice(-10);

      const totalCostInHistory = updatedCostHistory.reduce((acc, entry) => acc + (entry.cost * entry.quantity), 0);
      const totalQuantityInHistory = updatedCostHistory.reduce((acc, entry) => acc + entry.quantity, 0);
      const newAverageCost = totalQuantityInHistory > 0 ? totalCostInHistory / totalQuantityInHistory : 0;

      await tx.product.update({
        where: { id: receivedItem.productId },
        data: {
          stock: { increment: receivedItem.quantityReceived },
          costHistory: updatedCostHistory,
          averageCost: newAverageCost,
        }
      });
    }

    // Update Purchase Order
    let totalQuantityOrdered = 0;
    let newTotalQuantityReceived = 0;

    const currentItems = order.items as any[];
    const updatedPOItems = currentItems.map(item => {
      const received = validReceivedItems.find(r => r.productId === item.productId);
      const quantityJustReceived = received ? received.quantityReceived : 0;
      const newQuantityForThisItem = item.quantityReceived + quantityJustReceived;

      totalQuantityOrdered += item.quantityOrdered;
      newTotalQuantityReceived += newQuantityForThisItem;

      return { ...item, quantityReceived: newQuantityForThisItem };
    });

    const newStatus = newTotalQuantityReceived >= totalQuantityOrdered ? 'Recebido' : 'Recebido Parcialmente';

    await tx.purchaseOrder.update({
      where: { id: orderId },
      data: {
        items: updatedPOItems,
        status: newStatus,
        dateReceived: new Date(),
      }
    });

    // Create Stock Entry Log
    const totalCostOfReceipt = validReceivedItems.reduce((sum, item) => sum + (item.quantityReceived * item.cost), 0);
    const totalItemsInReceipt = validReceivedItems.reduce((sum, item) => sum + item.quantityReceived, 0);

    await tx.stockEntryLog.create({
      data: {
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        items: validReceivedItems.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantityReceived,
          cost: i.cost,
        })),
        totalCost: totalCostOfReceipt,
        totalItems: totalItemsInReceipt,
        registeredByUid: user.uid,
        registeredByName: user.name,
        purchaseOrderId: orderId,
        storeId: user.storeId,
      }
    });
  });
}

export async function logAuditEvent(action: string, details: string): Promise<void> {
  try {
    const user = await getAuthenticatedUser();
    await prisma.auditLog.create({
      data: {
        action,
        details,
        userUid: user.uid,
        userName: user.name,
        storeId: user.storeId,
      }
    });
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}

export async function getAuditLogsAction() {
  const user = await verifyUserRole(['Administrador', 'Gerente']);
  return await prisma.auditLog.findMany({
    where: { storeId: user.storeId },
    orderBy: { date: 'desc' },
  });
}

export async function sendWhatsAppBillingAction(customerId: string): Promise<{ success: boolean; message: string; whatsappUrl?: string }> {
  const user = await verifyUserRole(['Administrador', 'Gerente']);
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error("Cliente não encontrado.");

  const balance = customer.balance || 0;
  if (balance <= 0) {
    return { success: false, message: "Este cliente não possui saldo devedor pendente." };
  }

  const formattedPhone = customer.phone.replace(/\D/g, '');
  const messageText = `Olá *${customer.name}*, você possui um saldo pendente de *R$ ${balance.toFixed(2)}* na Alvorada Smart Market. Para facilitar, você pode efetuar o pagamento via Pix utilizando a nossa chave comercial. Obrigado!`;
  const whatsappUrl = `https://wa.me/55${formattedPhone}?text=${encodeURIComponent(messageText)}`;

  await logAuditEvent('Cobrança WhatsApp Enviada', `Disparo de cobrança simulado para ${customer.name} (${customer.phone}) no valor de R$ ${balance.toFixed(2)} por ${user.name}`);

  return {
    success: true,
    message: `Mensagem gerada com sucesso para ${customer.name}!`,
    whatsappUrl,
  };
}

export async function generatePixPaymentAction(amount: number, customerId?: string): Promise<{ qrCodeData: string; copyPasteKey: string; paymentId: string }> {
  const user = await getAuthenticatedUser();
  const paymentId = `mp-pix-${Math.random().toString(36).substr(2, 9)}`;

  const qrCodeData = `00020101021226870014br.gov.bcb.pix2565mp-pix-${paymentId}@mercadopago.com.br5204000053039865406${amount.toFixed(2)}5802BR5915AlvoradaMarket6009SaoPaulo62070503***6304`;
  const copyPasteKey = qrCodeData;

  await logAuditEvent('Simulação Pix MP Gerada', `Pix simulado gerado no valor de R$ ${amount.toFixed(2)} (ID: ${paymentId}) por ${user.name}`);

  return {
    qrCodeData,
    copyPasteKey,
    paymentId,
  };
}

export async function checkPixStatusAction(paymentId: string): Promise<{ status: 'PENDING' | 'APPROVED' }> {
  return { status: 'APPROVED' };
}
