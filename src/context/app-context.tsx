

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, writeBatch, getDoc, setDoc, query, orderBy, increment, where, deleteDoc, runTransaction, FieldValue, deleteField, getDocs, limit } from 'firebase/firestore';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import type { Product, Customer, Sale, Supplier, User, CashRegisterSession, CashTransaction, StockAdjustmentLog, SystemSettings, StockEntryLog, ProductChangeLog, AccountsPayable, PurchaseOrder } from '@/lib/types';
import { mockSuppliersData, mockProductsData } from '@/lib/data';
import type { ProductFormData } from '@/components/products/product-form';

interface AppContextType {
  user: User | null;
  allUsers: User[];
  systemSettings: SystemSettings | null;
  loadingAuth: boolean;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  suppliers: Supplier[];
  cashSessions: CashRegisterSession[];
  cashTransactions: CashTransaction[];
  stockAdjustmentLogs: StockAdjustmentLog[];
  stockEntryLogs: StockEntryLog[];
  productChangeLogs: ProductChangeLog[];
  accountsPayable: AccountsPayable[];
  purchaseOrders: PurchaseOrder[];
  activeSession: CashRegisterSession | null;
  loading: {
    products: boolean;
    customers: boolean;
    sales: boolean;
    suppliers: boolean;
    cashSessions: boolean;
    cashTransactions: boolean;
    stockAdjustmentLogs: boolean;
    stockEntryLogs: boolean;
    productChangeLogs: boolean;
    allUsers: boolean;
    systemSettings: boolean;
    accountsPayable: boolean;
    purchaseOrders: boolean;
  };
  addProduct: (product: ProductFormData) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  setProductStatus: (productId: string, status: 'Ativo' | 'Inativo') => Promise<void>;
  addStockToProducts: (items: { productId: string, quantity: number, cost: number }[], supplier: { id: string, name: string }) => Promise<void>;
  adjustStock: (productId: string, newQuantity: number, reason: StockAdjustmentLog['reason'], notes?: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'balance'>) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  addCreditPayment: (customerId: string, amount: number) => Promise<CashTransaction>;
  addSale: (sale: Omit<Sale, 'id' | 'date' | 'status'>) => Promise<Sale>;
  cancelSale: (saleId: string, reason: string, passwordAttempt: string) => Promise<void>;
  openCashRegister: (openingBalance: number) => Promise<void>;
  closeCashRegister: (closingBalance: number) => Promise<void>;
  correctCashClosing: (sessionId: string, newClosingBalance: number) => Promise<void>;
  correctOpeningBalance: (newOpeningBalance: number) => Promise<void>;
  reopenCashRegister: (sessionId: string) => Promise<void>;
  cancelCashRegisterOpening: (sessionId: string) => Promise<void>;
  addCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'date' | 'sessionId' | 'registeredBy'>) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  updateUserRole: (uid: string, role: User['role']) => Promise<void>;
  updateCancellationPassword: (newPassword: string) => Promise<void>;
  addPayable: (payable: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => Promise<void>;
  updatePayable: (payableId: string, data: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => Promise<void>;
  deletePayable: (payableId: string) => Promise<void>;
  markPayableAsPaid: (payableId: string, fromCashRegister: boolean) => Promise<void>;
  addPurchaseOrder: (orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy'>) => Promise<string>;
  updatePurchaseOrder: (orderId: string, orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy'>) => Promise<void>;
  receivePurchaseOrder: (orderId: string, receivedItems: { productId: string, productName: string, quantityReceived: number, cost: number }[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cashSessions, setCashSessions] = useState<CashRegisterSession[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [stockAdjustmentLogs, setStockAdjustmentLogs] = useState<StockAdjustmentLog[]>([]);
  const [stockEntryLogs, setStockEntryLogs] = useState<StockEntryLog[]>([]);
  const [productChangeLogs, setProductChangeLogs] = useState<ProductChangeLog[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<AccountsPayable[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  
  const [loading, setLoading] = useState({
    products: true,
    customers: true,
    sales: true,
    suppliers: true,
    cashSessions: true,
    cashTransactions: true,
    stockAdjustmentLogs: true,
    stockEntryLogs: true,
    productChangeLogs: true,
    allUsers: true,
    systemSettings: true,
    accountsPayable: true,
    purchaseOrders: true,
  });

  const activeSession = cashSessions.find(s => s.status === 'Aberto') || null;

  const seedDatabase = async () => {
    try {
        const batch = writeBatch(db);

        // This is a simple way to handle mock data idempotently for development.
        // It's not suitable for production migration.
        // It clears existing collections to ensure a fresh start with the latest mock data.
        console.log("Clearing existing mock data for a fresh seed...");
        const productsSnapshot = await getDocs(collection(db, 'products'));
        productsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        
        const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));
        suppliersSnapshot.docs.forEach(doc => batch.delete(doc.ref));

        console.log("Seeding new data...");
        mockSuppliersData.forEach(supplier => {
            const supplierRef = doc(collection(db, 'suppliers'));
            batch.set(supplierRef, supplier);
        });

        let skuCounter = 0;
        mockProductsData.forEach(product => {
            skuCounter++;
            const productRef = doc(collection(db, 'products'));
            batch.set(productRef, {
                ...product,
                sku: String(skuCounter),
                status: 'Ativo'
            });
        });

        const counterRef = doc(db, 'counters', 'products');
        batch.set(counterRef, { lastSku: skuCounter }, { merge: true });
        
        const settingsRef = doc(db, 'system', 'config');
        batch.set(settingsRef, { cancellationPassword: '1234' }, { merge: true });

        await batch.commit();
        console.log("Database seeded successfully.");
    } catch (error) {
        console.error("Error seeding database:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<User, 'uid'>;
          setUser({ uid: firebaseUser.uid, ...userData });
        } else {
          const usersCollectionRef = collection(db, 'users');
          const usersQuery = query(usersCollectionRef, limit(1));
          const usersSnapshot = await getDocs(usersQuery);
          const defaultRole = usersSnapshot.empty ? 'Administrador' : 'Operador de Caixa';

          const newUser: User = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Novo Usuário',
            email: firebaseUser.email || '',
            role: defaultRole,
          };
          await setDoc(userDocRef, {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          });
          setUser(newUser);
        }

        const seedFlagRef = doc(db, 'system', 'flags');
        const seedFlagDoc = await getDoc(seedFlagRef);
        // Changed to seeded_v2 to force re-seeding with barcodes
        if (!seedFlagDoc.exists() || !seedFlagDoc.data().seeded_v2) {
            console.log("Database needs to be seeded/updated. Running seed function...");
            await seedDatabase();
            await setDoc(seedFlagRef, { seeded_v2: true }, { merge: true });
        }

      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const addProduct = async (productData: ProductFormData) => {
    const counterRef = doc(db, 'counters', 'products');

    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let newSkuNumber = 1;
      if (counterDoc.exists()) {
        newSkuNumber = (counterDoc.data().lastSku || 0) + 1;
      }

      const newSku = String(newSkuNumber);

      const newProductRef = doc(collection(db, 'products'));
      transaction.set(newProductRef, {
        ...productData,
        sku: newSku,
        status: 'Ativo',
        averageCost: 0,
        costHistory: [],
      });

      transaction.set(counterRef, { lastSku: newSkuNumber }, { merge: true });
    });
  };

  useEffect(() => {
    if (!user) {
        setProducts([]);
        setCustomers([]);
        setSales([]);
        setSuppliers([]);
        setCashSessions([]);
        setStockAdjustmentLogs([]);
        setStockEntryLogs([]);
        setProductChangeLogs([]);
        setAllUsers([]);
        setSystemSettings(null);
        setAccountsPayable([]);
        setPurchaseOrders([]);
        setLoading({
            products: true, customers: true, sales: true, suppliers: true,
            cashSessions: true, cashTransactions: true, stockAdjustmentLogs: true,
            stockEntryLogs: true, productChangeLogs: true, allUsers: true,
            systemSettings: true, accountsPayable: true, purchaseOrders: true,
        });
        return;
    }

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(prev => ({ ...prev, products: false }));
    });

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
      setLoading(prev => ({ ...prev, customers: false }));
    });
    
    const salesQuery = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
      setLoading(prev => ({ ...prev, sales: false }));
    }, (error) => {
        console.error("Firestore error listening to sales:", error);
        setLoading(prev => ({ ...prev, sales: false }));
    });
    
    const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
      setLoading(prev => ({...prev, suppliers: false}));
    });

    const sessionsQuery = query(collection(db, 'cash-sessions'), orderBy('openingTime', 'desc'));
    const unsubCashSessions = onSnapshot(sessionsQuery, (snapshot) => {
      setCashSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CashRegisterSession)));
      setLoading(prev => ({ ...prev, cashSessions: false }));
    }, (error) => {
        console.error("Firestore error listening to cash sessions:", error);
        setLoading(prev => ({ ...prev, cashSessions: false }));
    });

    const adjLogsQuery = query(collection(db, 'stock-adjustment-logs'), orderBy('date', 'desc'));
    const unsubAdjLogs = onSnapshot(adjLogsQuery, (snapshot) => {
      setStockAdjustmentLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockAdjustmentLog)));
      setLoading(prev => ({...prev, stockAdjustmentLogs: false}));
    });
    
    let unsubUsers = () => {};
    let unsubSettings = () => {};
    let unsubStockEntryLogs = () => {};
    let unsubProductChangeLogs = () => {};
    let unsubAccountsPayable = () => {};
    let unsubPurchaseOrders = () => {};

    if (user.role === 'Administrador' || user.role === 'Gerente') {
        if (user.role === 'Administrador') {
            unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
                setAllUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
                setLoading(prev => ({...prev, allUsers: false}));
            });
            
            unsubSettings = onSnapshot(doc(db, 'system', 'config'), (doc) => {
                setSystemSettings(doc.data() as SystemSettings);
                setLoading(prev => ({...prev, systemSettings: false}));
            });
        }
        
        const stockEntryLogsQuery = query(collection(db, 'stock-entry-logs'), orderBy('date', 'desc'));
        unsubStockEntryLogs = onSnapshot(stockEntryLogsQuery, (snapshot) => {
            setStockEntryLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockEntryLog)));
            setLoading(prev => ({...prev, stockEntryLogs: false}));
        });
        
        const productChangeLogsQuery = query(collection(db, 'product-change-logs'), orderBy('date', 'desc'));
        unsubProductChangeLogs = onSnapshot(productChangeLogsQuery, (snapshot) => {
            setProductChangeLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductChangeLog)));
            setLoading(prev => ({...prev, productChangeLogs: false}));
        });

        const payableQuery = query(collection(db, 'accounts-payable'), orderBy('dueDate', 'asc'));
        unsubAccountsPayable = onSnapshot(payableQuery, (snapshot) => {
            setAccountsPayable(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountsPayable)));
            setLoading(prev => ({...prev, accountsPayable: false}));
        });

        const poQuery = query(collection(db, 'purchase-orders'), orderBy('dateCreated', 'desc'));
        unsubPurchaseOrders = onSnapshot(poQuery, (snapshot) => {
            setPurchaseOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder)));
            setLoading(prev => ({...prev, purchaseOrders: false}));
        });

    } else {
       setAllUsers([]);
       setSystemSettings(null);
       setStockEntryLogs([]);
       setProductChangeLogs([]);
       setAccountsPayable([]);
       setPurchaseOrders([]);
       setLoading(prev => ({...prev, allUsers: false, systemSettings: false, stockEntryLogs: false, productChangeLogs: false, accountsPayable: false, purchaseOrders: false }));
    }

    return () => {
      unsubProducts(); unsubCustomers(); unsubSales(); unsubAdjLogs();
      unsubSuppliers(); unsubCashSessions(); unsubUsers(); unsubSettings();
      unsubStockEntryLogs(); unsubProductChangeLogs(); unsubAccountsPayable(); unsubPurchaseOrders();
    };
  }, [user]);

  useEffect(() => {
    if (activeSession) {
      setLoading(prev => ({ ...prev, cashTransactions: true }));
      const transQuery = query(
        collection(db, 'cash-transactions'),
        where('sessionId', '==', activeSession.id),
        orderBy('date', 'desc')
      );
      const unsubscribe = onSnapshot(transQuery, (snapshot) => {
        setCashTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CashTransaction)));
        setLoading(prev => ({ ...prev, cashTransactions: false }));
      }, (error) => {
        console.error("Firestore error listening to cash transactions:", error);
        setLoading(prev => ({ ...prev, cashTransactions: false }));
      });
      return () => unsubscribe();
    } else {
      setCashTransactions([]);
      setLoading(prev => ({ ...prev, cashTransactions: false }));
    }
  }, [activeSession]);

  const updateProduct = async (updatedProductData: Product) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const { id, ...data } = updatedProductData;
    const productRef = doc(db, 'products', id);

    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw new Error("Produto não encontrado.");

        const oldProductData = productDoc.data() as Product;
        const changes: ProductChangeLog['changes'] = [];
        const fieldsToLog: (keyof Product)[] = ['name', 'price', 'category', 'supplier', 'minStock', 'unit', 'barcode'];

        fieldsToLog.forEach(field => {
            if (oldProductData[field] !== data[field]) {
                changes.push({
                    field: String(field), // Ensure field is a string
                    oldValue: oldProductData[field],
                    newValue: data[field],
                });
            }
        });
      
        transaction.update(productRef, data);

        if (changes.length > 0) {
            const logRef = doc(collection(db, 'product-change-logs'));
            const logEntry: Omit<ProductChangeLog, 'id'> = {
                date: new Date().toISOString(),
                productId: id,
                productName: data.name,
                changedBy: { uid: user.uid, name: user.name },
                changes: changes
            };
            transaction.set(logRef, logEntry);
        }
    });
  };
  
  const setProductStatus = async (productId: string, status: 'Ativo' | 'Inativo') => {
    await updateDoc(doc(db, 'products', productId), { status });
  };

  const addStockToProducts = async (items: { productId: string, quantity: number, cost: number }[], supplier: { id: string, name: string }) => {
    if (!user) throw new Error("Usuário não autenticado.");
     
     for (const item of items) {
        if (item.quantity <= 0 || item.cost < 0) continue;

        const productRef = doc(db, 'products', item.productId);
        await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
                throw new Error(`Produto com id ${item.productId} não encontrado.`);
            }
            const productData = productDoc.data() as Product;

            const newHistoryEntry = {
                date: new Date().toISOString(),
                quantity: item.quantity,
                cost: item.cost,
            };

            let updatedCostHistory = [...(productData.costHistory || []), newHistoryEntry];
            if (updatedCostHistory.length > 10) {
                updatedCostHistory = updatedCostHistory.slice(-10);
            }

            const totalCostInHistory = updatedCostHistory.reduce((acc, entry) => acc + (entry.cost * entry.quantity), 0);
            const totalQuantityInHistory = updatedCostHistory.reduce((acc, entry) => acc + entry.quantity, 0);
            const newAverageCost = totalQuantityInHistory > 0 ? totalCostInHistory / totalQuantityInHistory : 0;

            transaction.update(productRef, {
                stock: increment(item.quantity),
                costHistory: updatedCostHistory,
                averageCost: newAverageCost,
            });
        });
    }

    const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const productDetails = await Promise.all(items.map(async item => {
        const productDoc = await getDoc(doc(db, 'products', item.productId));
        return {
            productId: item.productId,
            productName: productDoc.exists() ? productDoc.data().name : 'Desconhecido',
            quantity: item.quantity,
            cost: item.cost,
        }
    }));
    
    const logEntry: Omit<StockEntryLog, 'id'> = {
        date: new Date().toISOString(),
        supplierId: supplier.id,
        supplierName: supplier.name,
        items: productDetails,
        totalCost,
        totalItems,
        registeredBy: { uid: user.uid, name: user.name },
    };
    await addDoc(collection(db, 'stock-entry-logs'), logEntry);
  };

  const adjustStock = async (productId: string, newQuantity: number, reason: StockAdjustmentLog['reason'], notes?: string) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const productRef = doc(db, 'products', productId);
    const logRef = doc(collection(db, 'stock-adjustment-logs'));
    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw new Error("Produto não encontrado.");
        const productData = productDoc.data() as Product;
        const logEntry: Omit<StockAdjustmentLog, 'id'> = {
            productId: productId, productName: productData.name,
            adjustedBy: { uid: user.uid, name: user.name }, date: new Date().toISOString(),
            oldQuantity: productData.stock, newQuantity: newQuantity, reason: reason, notes: notes || '',
        };
        transaction.set(logRef, logEntry);
        transaction.update(productRef, { stock: newQuantity });
    });
  };

  const addCustomer = async (customerData: Omit<Customer, 'id'|'balance'>) => {
    await addDoc(collection(db, 'customers'), {
        ...customerData,
        balance: 0,
        tags: customerData.tags || [],
        notes: customerData.notes || '',
    });
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    const { id, ...data } = updatedCustomer;
    await updateDoc(doc(db, 'customers', id), {
        ...data,
        tags: data.tags || [],
        notes: data.notes || ''
    });
  };
  
  const deleteCustomer = async (customerId: string) => {
    await deleteDoc(doc(db, 'customers', customerId));
  };

  const addCreditPayment = async (customerId: string, amount: number): Promise<CashTransaction> => {
    if (!activeSession) throw new Error("Não há um caixa aberto. Impossível registrar o pagamento.");
    if (!user) throw new Error("Usuário não autenticado.");

    const customerRef = doc(db, 'customers', customerId);
    const sessionRef = doc(db, 'cash-sessions', activeSession.id);
    const transactionRef = doc(collection(db, 'cash-transactions'));

    return await runTransaction(db, async (transaction) => {
      const customerDoc = await transaction.get(customerRef);
      if (!customerDoc.exists()) throw new Error("Cliente não encontrado.");
      const customerData = customerDoc.data() as Customer;
      transaction.update(customerRef, { balance: increment(-amount) });
      transaction.update(sessionRef, {
        calculatedCashInDrawer: increment(amount), totalCreditPayments: increment(amount),
      });
      const newTransactionData: Omit<CashTransaction, 'id'> = {
        sessionId: activeSession.id, type: 'Recebimento Fiado', amount: amount,
        description: `Pagamento recebido de ${customerData.name}`, date: new Date().toISOString(),
        registeredBy: { uid: user.uid, name: user.name }, customerId: customerId, customerName: customerData.name,
      };
      transaction.set(transactionRef, newTransactionData);

      return { ...newTransactionData, id: transactionRef.id };
    });
  };

  const addSale = async (saleData: Omit<Sale, 'id' | 'date' | 'status'>): Promise<Sale> => {
    if (!activeSession) throw new Error("Não há um caixa aberto. Impossível registrar a venda.");
    if (!user) throw new Error("Usuário não autenticado.");

    return await runTransaction(db, async (transaction) => {
        const productRefs = saleData.items.map(item => doc(db, 'products', item.productId));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));
        
        const itemsWithCost = [];
        let totalCost = 0;

        for (let i = 0; i < saleData.items.length; i++) {
            const item = saleData.items[i];
            const productDoc = productDocs[i];

            if (!productDoc.exists() || productDoc.data().stock < item.quantity) {
                throw new Error(`Estoque insuficiente para o produto ${item.productName}`);
            }
            const productData = productDoc.data() as Product;
            const costAtTimeOfSale = productData.averageCost || 0;
            itemsWithCost.push({ ...item, costAtTimeOfSale });
            totalCost += costAtTimeOfSale * item.quantity;
        }

        const totalProfit = saleData.total - totalCost;
        const saleWithAllData = {
            ...saleData,
            items: itemsWithCost,
            totalCost,
            totalProfit,
            date: new Date().toISOString(),
            status: 'Concluída' as const,
            cashRegisterSessionId: activeSession.id,
        };

        const saleRef = doc(collection(db, 'sales'));
        transaction.set(saleRef, saleWithAllData);

        saleData.items.forEach((item, i) => {
            const productRef = productRefs[i];
            transaction.update(productRef, { stock: increment(-item.quantity) });
        });
        
        const sessionRef = doc(db, 'cash-sessions', activeSession.id);
        const sessionUpdate: {[key: string]: any} = { totalSales: increment(saleData.total) };
        
        let fiadoAmount = 0;
        for (const payment of saleData.paymentMethods) {
          if (payment.method === 'Dinheiro') {
            sessionUpdate.calculatedCashInDrawer = increment(payment.amount);
            sessionUpdate[`salesByPaymentMethod.Dinheiro`] = increment(payment.amount);
          } else if (payment.method === 'Cartão') {
            sessionUpdate[`salesByPaymentMethod.Cartão`] = increment(payment.amount);
          } else if (payment.method === 'Pix') {
            sessionUpdate[`salesByPaymentMethod.Pix`] = increment(payment.amount);
          } else if (payment.method === 'Fiado') {
            fiadoAmount = payment.amount;
          }
        }
        transaction.update(sessionRef, sessionUpdate);

        if (fiadoAmount > 0 && saleData.customerId !== 'default') {
            transaction.update(doc(db, 'customers', saleData.customerId), { balance: increment(fiadoAmount) });
        }

        return { ...saleWithAllData, id: saleRef.id };
    });
  };

  const cancelSale = async (saleId: string, reason: string, passwordAttempt: string) => {
    if (!user) throw new Error("Usuário não autenticado.");
    if (user.role !== 'Administrador' && user.role !== 'Gerente') {
      throw new Error("Você não tem permissão para cancelar vendas.");
    }
    const settingsDoc = await getDoc(doc(db, 'system', 'config'));
    const currentPassword = settingsDoc.data()?.cancellationPassword || '1234';
    if (passwordAttempt !== currentPassword) throw new Error("Senha de cancelamento incorreta.");

    await runTransaction(db, async (transaction) => {
      const saleRef = doc(db, 'sales', saleId);
      const saleDoc = await transaction.get(saleRef);
      if (!saleDoc.exists()) throw new Error("Venda não encontrada.");
      const saleData = saleDoc.data() as Sale;
      if (saleData.status === 'Cancelada') throw new Error("Esta venda já foi cancelada.");
      
      for (const item of saleData.items) {
        const productRef = doc(db, 'products', item.productId);
        transaction.update(productRef, { stock: increment(item.quantity) });
      }

      if (saleData.cashRegisterSessionId) {
        const sessionRef = doc(db, 'cash-sessions', saleData.cashRegisterSessionId);
        const sessionUpdate: {[key: string]: any} = { totalSales: increment(-saleData.total) };
        
        for (const payment of saleData.paymentMethods) {
          if (payment.method === 'Dinheiro') {
            sessionUpdate.calculatedCashInDrawer = increment(-payment.amount);
            sessionUpdate[`salesByPaymentMethod.Dinheiro`] = increment(-payment.amount);
          } else if (payment.method === 'Cartão') {
            sessionUpdate[`salesByPaymentMethod.Cartão`] = increment(-payment.amount);
          } else if (payment.method === 'Pix') {
            sessionUpdate[`salesByPaymentMethod.Pix`] = increment(-payment.amount);
          } else if (payment.method === 'Fiado' && saleData.customerId !== 'default') {
             transaction.update(doc(db, 'customers', saleData.customerId), { balance: increment(-payment.amount) });
          }
        }
        transaction.update(sessionRef, sessionUpdate);
      }

      transaction.update(saleRef, {
        status: 'Cancelada',
        cancellationReason: reason,
        cancellationDate: new Date().toISOString(),
        cancelledBy: { uid: user.uid, name: user.name }
      });
    });
  };

  const openCashRegister = async (openingBalance: number) => {
    if (activeSession) throw new Error("Já existe um caixa aberto.");
    if (!user) throw new Error("Usuário não autenticado para abrir o caixa.");
    const newSession: Omit<CashRegisterSession, 'id'> = {
      openingTime: new Date().toISOString(), closingTime: null, openingBalance, closingBalance: null,
      calculatedCashInDrawer: openingBalance, totalSales: 0,
      salesByPaymentMethod: { Dinheiro: 0, Pix: 0, Cartão: 0 },
      totalExpenses: 0, totalWithdrawals: 0, totalCreditPayments: 0, status: 'Aberto',
      openedBy: { uid: user.uid, name: user.name }, closedBy: null,
    };
    await addDoc(collection(db, 'cash-sessions'), newSession);
  };

  const closeCashRegister = async (closingBalance: number) => {
    if (!activeSession) throw new Error("Nenhum caixa aberto para fechar.");
    if (!user) throw new Error("Usuário não autenticado para fechar o caixa.");
    const sessionRef = doc(db, 'cash-sessions', activeSession.id);
    await updateDoc(sessionRef, {
      status: 'Fechado', closingTime: new Date().toISOString(), closingBalance: closingBalance,
      closedBy: { uid: user.uid, name: user.name },
    });
  };

  const correctCashClosing = async (sessionId: string, newClosingBalance: number) => {
    if (!user) throw new Error("Usuário não autenticado para corrigir o caixa.");
    const sessionRef = doc(db, 'cash-sessions', sessionId);
    
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) throw new Error("Sessão não encontrada");
    const oldClosingBalance = sessionDoc.data().closingBalance || 0;

    await updateDoc(sessionRef, {
        closingBalance: newClosingBalance,
        correction: { 
            date: new Date().toISOString(), 
            user: { uid: user.uid, name: user.name },
            oldValue: oldClosingBalance,
            newValue: newClosingBalance
        }
    });
  };

  const correctOpeningBalance = async (newOpeningBalance: number) => {
    if (!activeSession) throw new Error("Não há caixa ativo para corrigir.");
    if (!user) throw new Error("Usuário não autenticado.");
    const sessionRef = doc(db, 'cash-sessions', activeSession.id);
    await runTransaction(db, async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        if (!sessionDoc.exists()) throw new Error("Sessão de caixa não encontrada.");
        const sessionData = sessionDoc.data() as CashRegisterSession;
        const difference = newOpeningBalance - sessionData.openingBalance;
        transaction.update(sessionRef, {
            openingBalance: newOpeningBalance,
            calculatedCashInDrawer: increment(difference),
            openingCorrection: { 
                date: new Date().toISOString(), 
                user: { uid: user.uid, name: user.name },
                oldValue: sessionData.openingBalance,
                newValue: newOpeningBalance
            }
        });
    });
  };

  const reopenCashRegister = async (sessionId: string) => {
    if (activeSession) throw new Error("Não é possível reabrir um caixa enquanto outro já está ativo.");
    await updateDoc(doc(db, 'cash-sessions', sessionId), {
        status: 'Aberto', closingTime: null, closingBalance: null, closedBy: null, correction: deleteField(),
    });
  };

  const cancelCashRegisterOpening = async (sessionId: string) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const sessionRef = doc(db, 'cash-sessions', sessionId);
    await runTransaction(db, async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);
      if (!sessionDoc.exists()) throw new Error("Sessão de caixa não encontrada.");
      const sessionData = sessionDoc.data() as CashRegisterSession;
      const hasTransactions = sessionData.totalSales > 0 || sessionData.totalExpenses > 0 || sessionData.totalWithdrawals > 0 || sessionData.totalCreditPayments > 0;
      if (hasTransactions) throw new Error("Não é possível cancelar. O caixa já possui movimentações.");
      transaction.delete(sessionRef);
    });
  };

  const addCashTransaction = async (transactionData: Omit<CashTransaction, 'id' | 'date' | 'sessionId' | 'registeredBy'>) => {
    if (!activeSession) throw new Error("Nenhum caixa ativo.");
    if (!user) throw new Error("Usuário não autenticado.");
    const batch = writeBatch(db);
    const newTransaction: Omit<CashTransaction, 'id'> = {
        ...transactionData, sessionId: activeSession.id, date: new Date().toISOString(),
        registeredBy: { uid: user.uid, name: user.name },
    };
    batch.set(doc(collection(db, 'cash-transactions')), newTransaction);
    const sessionRef = doc(db, 'cash-sessions', activeSession.id);
    const updatePayload: any = { calculatedCashInDrawer: increment(-transactionData.amount) };
    if (transactionData.type === 'Despesa') updatePayload.totalExpenses = increment(transactionData.amount);
    else if (transactionData.type === 'Sangria') updatePayload.totalWithdrawals = increment(transactionData.amount);
    batch.update(sessionRef, updatePayload);
    await batch.commit();
  };

  const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    await addDoc(collection(db, 'suppliers'), supplierData);
  };
  const updateSupplier = async (updatedSupplier: Supplier) => {
    const { id, ...data } = updatedSupplier;
    await updateDoc(doc(db, 'suppliers', id), data);
  };
  const deleteSupplier = async (supplierId: string) => {
    await deleteDoc(doc(db, 'suppliers', supplierId));
  };

  const updateUserRole = async (uid: string, role: User['role']) => {
    if (!user || user.role !== 'Administrador') throw new Error("Apenas administradores podem alterar funções.");
    if (user.uid === uid) throw new Error("Não é possível alterar sua própria função.");
    await updateDoc(doc(db, 'users', uid), { role });
  };
  
  const updateCancellationPassword = async (newPassword: string) => {
    if (!user || user.role !== 'Administrador') throw new Error("Apenas administradores podem alterar senhas.");
    await setDoc(doc(db, 'system', 'config'), { cancellationPassword: newPassword }, { merge: true });
  };

  const addPayable = async (payableData: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const newPayable = {
        ...payableData,
        dateCreated: new Date().toISOString(),
        status: 'Pendente' as const,
        paymentDate: null,
        registeredBy: { uid: user.uid, name: user.name }
    };
    await addDoc(collection(db, 'accounts-payable'), newPayable);
  };

  const updatePayable = async (payableId: string, data: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => {
    const payableRef = doc(db, 'accounts-payable', payableId);
    
    // Explicitly build the update object to handle optional fields correctly.
    const updateData: { [key: string]: any } = {
      description: data.description,
      amount: data.amount,
      dueDate: data.dueDate,
    };

    // Only include supplier fields if they exist, otherwise remove them.
    if (data.supplierId && data.supplierName) {
      updateData.supplierId = data.supplierId;
      updateData.supplierName = data.supplierName;
    } else {
      updateData.supplierId = deleteField();
      updateData.supplierName = deleteField();
    }

    await updateDoc(payableRef, updateData);
  };
  
  const deletePayable = async (payableId: string) => {
    await deleteDoc(doc(db, 'accounts-payable', payableId));
  };

  const markPayableAsPaid = async (payableId: string, fromCashRegister: boolean) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const payableRef = doc(db, 'accounts-payable', payableId);
    
    await runTransaction(db, async (transaction) => {
        const payableDoc = await transaction.get(payableRef);
        if (!payableDoc.exists()) throw new Error("Conta a pagar não encontrada.");
        const payableData = payableDoc.data() as AccountsPayable;

        if (fromCashRegister) {
            if (!activeSession) throw new Error("Não há caixa aberto para registrar o pagamento.");
            const sessionRef = doc(db, 'cash-sessions', activeSession.id);
            const transactionRef = doc(collection(db, 'cash-transactions'));

            const newTransaction: Omit<CashTransaction, 'id'> = {
                sessionId: activeSession.id,
                type: 'Despesa',
                amount: payableData.amount,
                description: `Pagamento: ${payableData.description}`,
                date: new Date().toISOString(),
                registeredBy: { uid: user.uid, name: user.name },
            };
            transaction.set(transactionRef, newTransaction);
            
            transaction.update(sessionRef, {
                calculatedCashInDrawer: increment(-payableData.amount),
                totalExpenses: increment(payableData.amount),
            });
        }
        
        transaction.update(payableRef, {
            status: 'Pago',
            paymentDate: new Date().toISOString(),
            cashSessionId: fromCashRegister && activeSession ? activeSession.id : null,
        });
    });
  };

  const addPurchaseOrder = async (orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy'>) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const newOrder = {
        ...orderData,
        dateCreated: new Date().toISOString(),
        status: 'Pendente' as const,
        registeredBy: { uid: user.uid, name: user.name },
        items: orderData.items.map(item => ({ ...item, quantityReceived: 0 }))
    };
    const docRef = await addDoc(collection(db, 'purchase-orders'), newOrder);
    return docRef.id;
  };
  
  const updatePurchaseOrder = async (orderId: string, orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy' | 'items' | 'totalCost'> & { items: any; totalCost: any}) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const orderRef = doc(db, 'purchase-orders', orderId);
    await updateDoc(orderRef, orderData);
  };

  const receivePurchaseOrder = async (orderId: string, receivedItems: { productId: string, productName: string, quantityReceived: number, cost: number }[]) => {
    if (!user) throw new Error("Usuário não autenticado.");

    const orderRef = doc(db, 'purchase-orders', orderId);

    await runTransaction(db, async (transaction) => {
        // --- 1. READ PHASE ---
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error("Pedido de compra não encontrado.");

        const validReceivedItems = receivedItems.filter(item => item.quantityReceived > 0);
        const productRefs = validReceivedItems.map(item => doc(db, 'products', item.productId));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        // --- 2. VALIDATION & PREPARATION ---
        const orderData = orderDoc.data() as PurchaseOrder;
        const productsData: { [id: string]: Product } = {};

        for (let i = 0; i < productDocs.length; i++) {
            const productDoc = productDocs[i];
            if (!productDoc.exists()) {
                throw new Error(`Produto ${validReceivedItems[i].productName} não encontrado.`);
            }
            productsData[productDoc.id] = productDoc.data() as Product;
        }

        // --- 3. WRITE PHASE ---

        // Update products (stock and cost)
        for (const receivedItem of validReceivedItems) {
            const productRef = doc(db, 'products', receivedItem.productId);
            const productData = productsData[receivedItem.productId];

            transaction.update(productRef, { stock: increment(receivedItem.quantityReceived) });

            const newHistoryEntry = { date: new Date().toISOString(), quantity: receivedItem.quantityReceived, cost: receivedItem.cost };
            let updatedCostHistory = [...(productData.costHistory || []), newHistoryEntry];
            if (updatedCostHistory.length > 10) updatedCostHistory = updatedCostHistory.slice(-10);

            const totalCostInHistory = updatedCostHistory.reduce((acc, entry) => acc + (entry.cost * entry.quantity), 0);
            const totalQuantityInHistory = updatedCostHistory.reduce((acc, entry) => acc + entry.quantity, 0);
            const newAverageCost = totalQuantityInHistory > 0 ? totalCostInHistory / totalQuantityInHistory : 0;
            
            transaction.update(productRef, {
                costHistory: updatedCostHistory,
                averageCost: newAverageCost,
            });
        }
        
        // Update Purchase Order
        let totalQuantityOrdered = 0;
        let newTotalQuantityReceived = 0;

        const updatedPOItems = orderData.items.map(item => {
            const received = validReceivedItems.find(r => r.productId === item.productId);
            const quantityJustReceived = received ? received.quantityReceived : 0;
            const newQuantityForThisItem = item.quantityReceived + quantityJustReceived;

            totalQuantityOrdered += item.quantityOrdered;
            newTotalQuantityReceived += newQuantityForThisItem;

            return { ...item, quantityReceived: newQuantityForThisItem };
        });
        
        const newStatus: PurchaseOrder['status'] = newTotalQuantityReceived >= totalQuantityOrdered ? 'Recebido' : 'Recebido Parcialmente';

        transaction.update(orderRef, {
            items: updatedPOItems,
            status: newStatus,
            dateReceived: new Date().toISOString(),
        });
        
        // Create Stock Entry Log
        const totalCostOfReceipt = validReceivedItems.reduce((sum, item) => sum + (item.quantityReceived * item.cost), 0);
        const totalItemsInReceipt = validReceivedItems.reduce((sum, item) => sum + item.quantityReceived, 0);

        const logEntry: Omit<StockEntryLog, 'id'> = {
            date: new Date().toISOString(),
            supplierId: orderData.supplierId,
            supplierName: orderData.supplierName,
            items: validReceivedItems.map(i => ({
                productId: i.productId,
                productName: i.productName,
                quantity: i.quantityReceived,
                cost: i.cost,
            })),
            totalCost: totalCostOfReceipt,
            totalItems: totalItemsInReceipt,
            registeredBy: { uid: user.uid, name: user.name },
            purchaseOrderId: orderId,
        };
        const logRef = doc(collection(db, 'stock-entry-logs'));
        transaction.set(logRef, logEntry);
    });
};

  return (
    <AppContext.Provider value={{ 
      user, allUsers, systemSettings, loadingAuth, products, customers, sales, suppliers, cashSessions,
      cashTransactions, stockAdjustmentLogs, stockEntryLogs, productChangeLogs, accountsPayable, purchaseOrders,
      activeSession, loading,
      addProduct, updateProduct, setProductStatus, addStockToProducts,
      adjustStock, addCustomer, updateCustomer, deleteCustomer, addCreditPayment, addSale, cancelSale, openCashRegister,
      closeCashRegister, correctCashClosing, correctOpeningBalance, reopenCashRegister, cancelCashRegisterOpening,
      addCashTransaction, addSupplier, updateSupplier, deleteSupplier, updateUserRole, updateCancellationPassword,
      addPayable, updatePayable, deletePayable, markPayableAsPaid, addPurchaseOrder, updatePurchaseOrder,
      receivePurchaseOrder
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

export const useAuth = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAuth must be used within an AppProvider');
  return context;
};
