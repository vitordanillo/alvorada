'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Product, Customer, Sale, Supplier, User, CashRegisterSession, CashTransaction, StockAdjustmentLog, SystemSettings, StockEntryLog, ProductChangeLog, AccountsPayable, PurchaseOrder } from '@/lib/types';
import type { ProductFormData } from '@/components/products/product-form';
import {
  getCurrentUserAction,
  getLegacyOfflineSessionsAction,
  getInitialDataAction,
  getCashTransactionsAction,
  addProductAction,
  updateProductAction,
  setProductStatusAction,
  addStockToProductsAction,
  adjustStockAction,
  addCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  addCreditPaymentAction,
  addSaleAction,
  cancelSaleAction,
  openCashRegisterAction,
  closeCashRegisterAction,
  correctCashClosingAction,
  correctOpeningBalanceAction,
  reopenCashRegisterAction,
  cancelCashRegisterOpeningAction,
  addCashTransactionAction,
  addSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
  updateUserRoleAction,
  updateCancellationPasswordAction,
  addPayableAction,
  updatePayableAction,
  deletePayableAction,
  markPayableAsPaidAction,
  addPurchaseOrderAction,
  updatePurchaseOrderAction,
  receivePurchaseOrderAction,
  loginUserAction,
  createUserAction,
  logoutUserAction,
} from '@/lib/db-actions';

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
  createUser: (name: string, email: string, password: string, role: User['role']) => Promise<void>;
  updateCancellationPassword: (newPassword: string) => Promise<void>;
  addPayable: (payable: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => Promise<void>;
  updatePayable: (payableId: string, data: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => Promise<void>;
  deletePayable: (payableId: string) => Promise<void>;
  markPayableAsPaid: (payableId: string, fromCashRegister: boolean) => Promise<void>;
  addPurchaseOrder: (orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy'>) => Promise<string>;
  updatePurchaseOrder: (orderId: string, orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy'>) => Promise<void>;
  receivePurchaseOrder: (orderId: string, receivedItems: { productId: string, productName: string, quantityReceived: number, cost: number }[]) => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
  dataError: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [dataError,setDataError]=useState('');
  const requestVersion=React.useRef(0);
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

  const cacheScope=user?.storeId ? `${user.uid}:${user.storeId}` : '';
  const activeSession = cashSessions.find(s => s.status === 'Aberto') || null;

  const refreshData = async () => {
    if (!user?.storeId) return;
    const version=++requestVersion.current;
    setDataError('');
    try {
      const data = await getInitialDataAction(user?.storeId);
      if(version!==requestVersion.current) return;
      setProducts(data.products);
      setCustomers(data.customers);
      setSales(data.sales);
      setSuppliers(data.suppliers);
      setCashSessions(data.cashSessions);
      setStockAdjustmentLogs(data.stockAdjustmentLogs);
      setAllUsers(data.allUsers);
      setSystemSettings(data.systemSettings);
      setStockEntryLogs(data.stockEntryLogs);
      setProductChangeLogs(data.productChangeLogs);
      setAccountsPayable(data.accountsPayable);
      setPurchaseOrders(data.purchaseOrders);

      // Save to IndexedDB local cache for offline usage
      import('@/lib/offline-db').then((db) => {
        db.saveToCache(cacheScope, 'products', data.products);
        db.saveToCache(cacheScope, 'customers', data.customers);
        db.saveToCache(cacheScope, 'sales', data.sales);
        db.saveToCache(cacheScope, 'suppliers', data.suppliers);
        db.saveToCache(cacheScope, 'cashSessions', data.cashSessions);
        db.saveToCache(cacheScope, 'stockAdjustmentLogs', data.stockAdjustmentLogs);
        db.saveToCache(cacheScope, 'allUsers', data.allUsers);
        db.saveToCache(cacheScope, 'systemSettings', data.systemSettings);
        db.saveToCache(cacheScope, 'stockEntryLogs', data.stockEntryLogs);
        db.saveToCache(cacheScope, 'productChangeLogs', data.productChangeLogs);
        db.saveToCache(cacheScope, 'accountsPayable', data.accountsPayable);
        db.saveToCache(cacheScope, 'purchaseOrders', data.purchaseOrders);
      }).catch(err => console.error("Cache import error:", err));

      setLoading(prev => ({
        ...prev,
        products: false,
        customers: false,
        sales: false,
        suppliers: false,
        cashSessions: false,
        stockAdjustmentLogs: false,
        stockEntryLogs: false,
        productChangeLogs: false,
        allUsers: false,
        systemSettings: false,
        accountsPayable: false,
        purchaseOrders: false,
      }));
    } catch (error) {
      if(version!==requestVersion.current) return;
      if(typeof window==='undefined' || navigator.onLine) {
        setDataError(error instanceof Error ? error.message : 'Falha ao carregar os dados. Atualize a página.');
        return;
      }
      console.warn('Conexão indisponível; carregando o cache desta loja.');
      // Attempt load from IndexedDB cache
      try {
        const db = await import('@/lib/offline-db');
        const cachedProducts = await db.getFromCache<Product[]>(cacheScope, 'products') || [];
        const cachedCustomers = await db.getFromCache<Customer[]>(cacheScope, 'customers') || [];
        const cachedSales = await db.getFromCache<Sale[]>(cacheScope, 'sales') || [];
        const cachedSuppliers = await db.getFromCache<Supplier[]>(cacheScope, 'suppliers') || [];
        const cachedCashSessions = await db.getFromCache<CashRegisterSession[]>(cacheScope, 'cashSessions') || [];
        const cachedLogs = await db.getFromCache<StockAdjustmentLog[]>(cacheScope, 'stockAdjustmentLogs') || [];
        const cachedUsers = await db.getFromCache<User[]>(cacheScope, 'allUsers') || [];
        const cachedSettings = await db.getFromCache<SystemSettings>(cacheScope, 'systemSettings');
        const cachedStockEntryLogs = await db.getFromCache<StockEntryLog[]>(cacheScope, 'stockEntryLogs') || [];
        const cachedProductChangeLogs = await db.getFromCache<ProductChangeLog[]>(cacheScope, 'productChangeLogs') || [];
        const cachedPayable = await db.getFromCache<AccountsPayable[]>(cacheScope, 'accountsPayable') || [];
        const cachedOrders = await db.getFromCache<PurchaseOrder[]>(cacheScope, 'purchaseOrders') || [];

        if(version!==requestVersion.current) return;

        setProducts(cachedProducts);
        setCustomers(cachedCustomers);
        setSales(cachedSales);
        setSuppliers(cachedSuppliers);
        setCashSessions(cachedCashSessions);
        setStockAdjustmentLogs(cachedLogs);
        setAllUsers(cachedUsers);
        setSystemSettings(cachedSettings);
        setStockEntryLogs(cachedStockEntryLogs);
        setProductChangeLogs(cachedProductChangeLogs);
        setAccountsPayable(cachedPayable);
        setPurchaseOrders(cachedOrders);

        setLoading(prev => ({
          ...prev,
          products: false,
          customers: false,
          sales: false,
          suppliers: false,
          cashSessions: false,
          stockAdjustmentLogs: false,
          stockEntryLogs: false,
          productChangeLogs: false,
          allUsers: false,
          systemSettings: false,
          accountsPayable: false,
          purchaseOrders: false,
        }));
      } catch (dbErr) {
        console.error("Offline cache resolution failed:", dbErr);
      }
    }
  };

  // Synchronize offline sales queue
  const syncOfflineSales = async () => {
    if(!user?.storeId) return;
    try {
      const db = await import('@/lib/offline-db');
      const legacy=await db.getLegacyQueuedSales();
      if(legacy.length) {
        const owned=await getLegacyOfflineSessionsAction([...new Set(legacy.map(s=>s.activeSessionId))],user.storeId);
        await db.recoverLegacySales(cacheScope,legacy.filter(s=>owned.includes(s.activeSessionId)));
      }
      const queued = await db.getQueuedSales(cacheScope);
      if (queued.length === 0) return;

      console.log(`Syncing ${queued.length} offline sales...`);
      let successCount = 0;

      for (const item of queued) {
        try {
          await addSaleAction(item.saleData, item.activeSessionId, user?.storeId);
          await db.removeQueuedSale(cacheScope, item.id);
          successCount++;
        } catch (err) {
          console.error(`Failed to sync queued sale ${item.id}:`, err);
        }
      }

      if (successCount > 0) {
        await refreshData();
        console.log(`Successfully synced ${successCount} offline sales!`);
      }
    } catch (err) {
      console.error("Failed to sync offline sales queue:", err);
    }
  };

  // On mount: Check auth session and sync offline sales
  useEffect(() => {
    getCurrentUserAction()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch((err) => {
        console.error("Error loading auth status:", err);
        setUser(null);
      })
      .finally(() => {
        setLoadingAuth(false);
      });
  }, []);

  // Sync listener when online
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', syncOfflineSales);
      if (navigator.onLine && user) {
        syncOfflineSales();
      }
      return () => {
        window.removeEventListener('online', syncOfflineSales);
      };
    }
  }, [user]);

  // On user change: Load or clear database listings
  useEffect(() => {
    if (user?.storeId) {
      refreshData();
    } else {
      requestVersion.current++;
      setProducts([]);
      setCustomers([]);
      setSales([]);
      setSuppliers([]);
      setCashSessions([]);
      setCashTransactions([]);
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
    }
  }, [user]);

  // Load transactions for the active register session
  useEffect(() => {
    if (activeSession) {
      setLoading(prev => ({ ...prev, cashTransactions: true }));
      getCashTransactionsAction(activeSession.id, user?.storeId)
        .then((trans) => {
          setCashTransactions(trans);
        })
        .catch((err) => {
          console.error("Error fetching transactions:", err);
        })
        .finally(() => {
          setLoading(prev => ({ ...prev, cashTransactions: false }));
        });
    } else {
      setCashTransactions([]);
      setLoading(prev => ({ ...prev, cashTransactions: false }));
    }
  }, [activeSession]);

  // Mutations
  const addProduct = async (productData: ProductFormData) => {
    await addProductAction(productData, user?.storeId);
    await refreshData();
  };

  const updateProduct = async (updatedProductData: Product) => {
    await updateProductAction(updatedProductData, user?.storeId);
    await refreshData();
  };
  
  const setProductStatus = async (productId: string, status: 'Ativo' | 'Inativo') => {
    await setProductStatusAction(productId, status, user?.storeId);
    await refreshData();
  };

  const addStockToProducts = async (items: { productId: string, quantity: number, cost: number }[], supplier: { id: string, name: string }) => {
    await addStockToProductsAction(items, supplier, user?.storeId);
    await refreshData();
  };

  const adjustStock = async (productId: string, newQuantity: number, reason: StockAdjustmentLog['reason'], notes?: string) => {
    await adjustStockAction(productId, newQuantity, reason, notes || '', user?.storeId);
    await refreshData();
  };

  const addCustomer = async (customerData: Omit<Customer, 'id'|'balance'>) => {
    await addCustomerAction(customerData, user?.storeId);
    await refreshData();
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    await updateCustomerAction(updatedCustomer, user?.storeId);
    await refreshData();
  };
  
  const deleteCustomer = async (customerId: string) => {
    await deleteCustomerAction(customerId, user?.storeId);
    await refreshData();
  };

  const addCreditPayment = async (customerId: string, amount: number): Promise<CashTransaction> => {
    if (!activeSession) throw new Error("Não há um caixa aberto. Impossível registrar o pagamento.");

    const transaction = await addCreditPaymentAction(customerId, amount, activeSession.id, user?.storeId);
    await refreshData();
    
    // Refresh cash transactions list
    const trans = await getCashTransactionsAction(activeSession.id, user?.storeId);
    setCashTransactions(trans);

    return transaction;
  };

  const addSale = async (saleData: Omit<Sale, 'id' | 'date' | 'status'>): Promise<Sale> => {
    if (!activeSession) throw new Error("Não há um caixa aberto. Impossível registrar a venda.");

    try {
      const sale = await addSaleAction(saleData, activeSession.id, user?.storeId);
      await refreshData();

      // Refresh cash transactions list
      const trans = await getCashTransactionsAction(activeSession.id, user?.storeId);
      setCashTransactions(trans);

      return sale;
    } catch (error) {
      console.warn("Failed to send sale to server, checking offline fallback...", error);
      if (typeof window !== 'undefined' && !navigator.onLine) {
        const db = await import('@/lib/offline-db');
        const tempId = `off-${Math.random().toString(36).substr(2, 9)}`;
        const localSale: Sale = {
          id: tempId,
          date: new Date().toISOString(),
          items: saleData.items,
          total: saleData.total,
          customerId: saleData.customerId,
          customerName: saleData.customerName,
          paymentMethods: saleData.paymentMethods,
          status: 'Concluída',
          cashRegisterSessionId: activeSession.id,
        };

        // Save queued sale
        await db.queueOfflineSale(cacheScope, {
          id: tempId,
          saleData,
          activeSessionId: activeSession.id,
          createdAt: new Date().toISOString(),
        });

        // Optimistically deduct stock locally
        setProducts(prevProducts => {
          const updated = prevProducts.map(p => {
            const item = saleData.items.find(i => i.productId === p.id);
            if (item) {
              return { ...p, stock: Math.max(0, p.stock - item.quantity) };
            }
            return p;
          });
          db.saveToCache(cacheScope, 'products', updated);
          return updated;
        });

        // Update local customer points/balance
        if (saleData.customerId !== 'default') {
          setCustomers(prevCustomers => {
            const updated = prevCustomers.map(c => {
              if (c.id === saleData.customerId) {
                let fiadoAmount = 0;
                let pointsUsed = 0;
                for (const pm of saleData.paymentMethods) {
                  if (pm.method === 'Fiado') fiadoAmount += pm.amount;
                  if (pm.method === 'Pontos') pointsUsed += pm.amount * 10;
                }
                const newBalance = c.balance + fiadoAmount;
                const pointsEarned = Math.floor((saleData.total - pointsUsed / 10) * 0.1);
                const newPoints = Math.max(0, (c.loyaltyPoints || 0) - pointsUsed + Math.max(0, pointsEarned));
                return { ...c, balance: newBalance, loyaltyPoints: newPoints };
              }
              return c;
            });
            db.saveToCache(cacheScope, 'customers', updated);
            return updated;
          });
        }

        // Add to sales state list
        setSales(prevSales => [localSale, ...prevSales]);

        return localSale;
      }
      throw error;
    }
  };

  const cancelSale = async (saleId: string, reason: string, passwordAttempt: string) => {
    await cancelSaleAction(saleId, reason, passwordAttempt, user?.storeId);
    await refreshData();

    if (activeSession) {
      const trans = await getCashTransactionsAction(activeSession.id, user?.storeId);
      setCashTransactions(trans);
    }
  };

  const openCashRegister = async (openingBalance: number) => {
    await openCashRegisterAction(openingBalance, user?.storeId);
    await refreshData();
  };

  const closeCashRegister = async (closingBalance: number) => {
    if (!activeSession) throw new Error("Nenhum caixa aberto para fechar.");
    await closeCashRegisterAction(activeSession.id, closingBalance, user?.storeId);
    await refreshData();
  };

  const correctCashClosing = async (sessionId: string, newClosingBalance: number) => {
    await correctCashClosingAction(sessionId, newClosingBalance, user?.storeId);
    await refreshData();
  };

  const correctOpeningBalance = async (newOpeningBalance: number) => {
    if (!activeSession) throw new Error("Não há caixa ativo para corrigir.");
    await correctOpeningBalanceAction(activeSession.id, newOpeningBalance, user?.storeId);
    await refreshData();
  };

  const reopenCashRegister = async (sessionId: string) => {
    await reopenCashRegisterAction(sessionId, user?.storeId);
    await refreshData();
  };

  const cancelCashRegisterOpening = async (sessionId: string) => {
    await cancelCashRegisterOpeningAction(sessionId, user?.storeId);
    await refreshData();
  };

  const addCashTransaction = async (transactionData: Omit<CashTransaction, 'id' | 'date' | 'sessionId' | 'registeredBy'>) => {
    if (!activeSession) throw new Error("Nenhum caixa ativo.");
    await addCashTransactionAction(transactionData, activeSession.id, user?.storeId);
    await refreshData();

    const trans = await getCashTransactionsAction(activeSession.id, user?.storeId);
    setCashTransactions(trans);
  };

  const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    await addSupplierAction(supplierData, user?.storeId);
    await refreshData();
  };
  
  const updateSupplier = async (updatedSupplier: Supplier) => {
    await updateSupplierAction(updatedSupplier, user?.storeId);
    await refreshData();
  };
  
  const deleteSupplier = async (supplierId: string) => {
    await deleteSupplierAction(supplierId, user?.storeId);
    await refreshData();
  };

  const updateUserRole = async (uid: string, role: User['role']) => {
    await updateUserRoleAction(uid, role, user?.storeId);
    await refreshData();
  };

  const createUser = async (name: string, email: string, password: string, role: User['role']) => {
    const created = await createUserAction(name, email, password, role, user?.storeId);
    setAllUsers((current) => [...current, created]);
  };
  
  const updateCancellationPassword = async (newPassword: string) => {
    await updateCancellationPasswordAction(newPassword, user?.storeId);
    await refreshData();
  };

  const addPayable = async (payableData: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => {
    await addPayableAction(payableData, user?.storeId);
    await refreshData();
  };

  const updatePayable = async (payableId: string, data: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => {
    await updatePayableAction(payableId, data, user?.storeId);
    await refreshData();
  };
  
  const deletePayable = async (payableId: string) => {
    await deletePayableAction(payableId, user?.storeId);
    await refreshData();
  };

  const markPayableAsPaid = async (payableId: string, fromCashRegister: boolean) => {
    await markPayableAsPaidAction(payableId, fromCashRegister, activeSession ? activeSession.id : null, user?.storeId);
    await refreshData();

    if (activeSession && fromCashRegister) {
      const trans = await getCashTransactionsAction(activeSession.id, user?.storeId);
      setCashTransactions(trans);
    }
  };

  const addPurchaseOrder = async (orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy'>) => {
    const orderId = await addPurchaseOrderAction(orderData, user?.storeId);
    await refreshData();
    return orderId;
  };
  
  const updatePurchaseOrder = async (orderId: string, orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy' | 'items' | 'totalCost'> & { items: any; totalCost: any}) => {
    await updatePurchaseOrderAction(orderId, orderData, user?.storeId);
    await refreshData();
  };

  const receivePurchaseOrder = async (orderId: string, receivedItems: { productId: string, productName: string, quantityReceived: number, cost: number }[]) => {
    await receivePurchaseOrderAction(orderId, receivedItems, user?.storeId);
    await refreshData();
  };

  const login = async (email: string, password: string) => {
    const loggedUser = await loginUserAction(email, password);
    setUser(loggedUser);
    return loggedUser;
  };

  const reloadUser = async () => { setUser(await getCurrentUserAction()); };

  const logout = async () => {
    await logoutUserAction();
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ 
      user, allUsers, systemSettings, loadingAuth, products, customers, sales, suppliers, cashSessions,
      cashTransactions, stockAdjustmentLogs, stockEntryLogs, productChangeLogs, accountsPayable, purchaseOrders,
      activeSession, loading,
      addProduct, updateProduct, setProductStatus, addStockToProducts,
      adjustStock, addCustomer, updateCustomer, deleteCustomer, addCreditPayment, addSale, cancelSale, openCashRegister,
      closeCashRegister, correctCashClosing, correctOpeningBalance, reopenCashRegister, cancelCashRegisterOpening,
      addCashTransaction, addSupplier, updateSupplier, deleteSupplier, updateUserRole, createUser, updateCancellationPassword,
      addPayable, updatePayable, deletePayable, markPayableAsPaid, addPurchaseOrder, updatePurchaseOrder,
      receivePurchaseOrder, login, logout, reloadUser, dataError
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
