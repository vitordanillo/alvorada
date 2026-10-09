'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {dataPlan} from '@/lib/data-plan';
import { usePathname, useSearchParams } from 'next/navigation';
import { newRequestId } from '@/lib/request-id';
import type { OfflineSale } from '@/lib/offline-db';
import { OfflineSyncPanel } from '@/components/layout/offline-sync-panel';
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
  submitSaleAction,
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
  closeCashRegister: (closingBalance: number, counted?:Record<string,number>) => Promise<void>;
  correctCashClosing: (sessionId: string, newClosingBalance: number, reason:string) => Promise<void>;
  correctOpeningBalance: (newOpeningBalance: number, reason:string) => Promise<void>;
  reopenCashRegister: (sessionId: string) => Promise<void>;
  cancelCashRegisterOpening: (sessionId: string) => Promise<void>;
  addCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'date' | 'sessionId' | 'registeredBy'>) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  updateUserRole: (uid: string, role: User['role'], reason:string) => Promise<void>;
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
  dataPage:{main:string;page:number;pageSize:number;total:number;catalogLimited:boolean};
  syncOfflineSales: () => Promise<void>;
  retryData: () => Promise<void>;
  offlineSync: {items:OfflineSale[];syncing:boolean;lastSync:string;error:string};
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const pathname=usePathname(),searchParams=useSearchParams();
  const [dataPage,setDataPage]=useState({main:'',page:1,pageSize:50,total:0,catalogLimited:false});
  const [dataError,setDataError]=useState('');
  const [offlineSync,setOfflineSync]=useState({items:[] as OfflineSale[],syncing:false,lastSync:'',error:''});
  const syncLock=React.useRef(false);
  const scopeRef=React.useRef('');
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
  scopeRef.current=cacheScope;
  const activeSession = cashSessions.find(s => s.status === 'Aberto') || null;

  const refreshData = async () => {
    if (!user?.storeId||user.mustChangePassword) return;
    const version=++requestVersion.current;
    setDataError('');
    try {
      const data = await getInitialDataAction(user?.storeId,pathname,Number(searchParams.get('page')??1),searchParams.get('search')??'',searchParams.get('from')??'',searchParams.get('to')??'');
      if(version!==requestVersion.current) return;
      setDataPage(data.meta);
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

      const needed=dataPlan(pathname).needed;
      // Save only complete operating catalogs, never replace them with a paginated list.
      import('@/lib/offline-db').then((db) => {
        if(needed.has('products')&&data.meta.main!=='products')void db.saveToCache(cacheScope, 'products', data.products);
        if(needed.has('customers')&&data.meta.main!=='customers')void db.saveToCache(cacheScope, 'customers', data.customers);
        if(needed.has('sales')&&data.meta.main!=='sales')void db.saveToCache(cacheScope, 'sales', data.sales);
        if(needed.has('suppliers')&&data.meta.main!=='suppliers')void db.saveToCache(cacheScope, 'suppliers', data.suppliers);
        if(needed.has('cashSessions')&&data.meta.main!=='cashSessions')void db.saveToCache(cacheScope, 'cashSessions', data.cashSessions);
        if(needed.has('stockAdjustmentLogs')&&data.meta.main!=='stockAdjustmentLogs')void db.saveToCache(cacheScope, 'stockAdjustmentLogs', data.stockAdjustmentLogs);
        if(needed.has('allUsers')&&data.meta.main!=='allUsers')void db.saveToCache(cacheScope, 'allUsers', data.allUsers);
        if(needed.has('systemSettings')&&data.meta.main!=='systemSettings')void db.saveToCache(cacheScope, 'systemSettings', data.systemSettings);
        if(needed.has('stockEntryLogs')&&data.meta.main!=='stockEntryLogs')void db.saveToCache(cacheScope, 'stockEntryLogs', data.stockEntryLogs);
        if(needed.has('productChangeLogs')&&data.meta.main!=='productChangeLogs')void db.saveToCache(cacheScope, 'productChangeLogs', data.productChangeLogs);
        if(needed.has('accountsPayable')&&data.meta.main!=='accountsPayable')void db.saveToCache(cacheScope, 'accountsPayable', data.accountsPayable);
        if(needed.has('purchaseOrders')&&data.meta.main!=='purchaseOrders')void db.saveToCache(cacheScope, 'purchaseOrders', data.purchaseOrders);
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
        setDataError('Não foi possível carregar os dados desta loja. Tente novamente.');
        setLoading(prev=>Object.fromEntries(Object.keys(prev).map(key=>[key,false])) as typeof prev);
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
    if(!user?.storeId || syncLock.current)return;
    const scope=cacheScope,storeId=user.storeId;syncLock.current=true;
    setOfflineSync(prev=>({...prev,syncing:true,error:''}));
    try{
      const db=await import('@/lib/offline-db');
      const legacy=await db.getLegacyQueuedSales();
      if(legacy.length){const owned=await getLegacyOfflineSessionsAction([...new Set(legacy.map(s=>s.activeSessionId))],storeId);await db.recoverLegacySales(scope,legacy.filter(s=>owned.includes(s.activeSessionId)));}
      const queued=await db.getQueuedSales(scope);let accepted=0;
      for(const item of queued){
        if(scopeRef.current!==scope || !navigator.onLine)break;
        const canonical={...item,saleData:{...item.saleData,clientRequestId:item.saleData.clientRequestId??item.id}};
        await db.queueOfflineSale(scope,canonical);
        try{
          const result=await submitSaleAction(canonical.saleData,canonical.activeSessionId,storeId);
          if(!result.ok)throw new Error(result.error);
          await db.removeQueuedSale(scope,item.id);accepted++;
        }catch(error){await db.queueOfflineSale(scope,{...canonical,attempts:(item.attempts??0)+1,lastError:error instanceof Error?error.message:'Não foi possível confirmar.'});}
      }
      const items=await db.getQueuedSales(scope);const lastSync=new Date().toISOString();
      await db.saveToCache(scope,'lastSync',lastSync);
      if(scopeRef.current===scope){setOfflineSync({items,syncing:false,lastSync,error:''});if(accepted)await refreshData();}
    }catch(error){if(scopeRef.current===scope)setOfflineSync(prev=>({...prev,error:'Falha na sincronização. As pendências foram preservadas.',syncing:false}));}
    finally{syncLock.current=false;if(scopeRef.current===scope)setOfflineSync(prev=>({...prev,syncing:false}));}
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

  useEffect(()=>{
    setOfflineSync({items:[],syncing:false,lastSync:'',error:''});
    if(!cacheScope)return;
    let cancelled=false;
    import('@/lib/offline-db').then(async db=>{
      const [items,lastSync]=await Promise.all([db.getQueuedSales(cacheScope),db.getFromCache<string>(cacheScope,'lastSync')]);
      if(!cancelled)setOfflineSync(prev=>({...prev,items,lastSync:lastSync??''}));
    }).catch(()=>{if(!cancelled)setOfflineSync(prev=>({...prev,error:'Não foi possível ler a fila local. Verifique o armazenamento do navegador.'}));});
    return()=>{cancelled=true;};
  },[cacheScope]);

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
    if (user?.storeId && !user.mustChangePassword) {
      setLoading(prev=>Object.fromEntries(Object.keys(prev).map(key=>[key,true])) as typeof prev);
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
  }, [user,pathname,searchParams]);

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

  const addSale = async (input: Omit<Sale, 'id' | 'date' | 'status'>):Promise<Sale> => {
    if(!activeSession || !user?.storeId)throw new Error('Abra o caixa antes de registrar a venda.');
    const saleData={...input,clientRequestId:input.clientRequestId??newRequestId()};
    const db=await import('@/lib/offline-db');const id=saleData.clientRequestId;
    const item={id,saleData,activeSessionId:activeSession.id,createdAt:new Date().toISOString()};
    await db.queueOfflineSale(cacheScope,item);
    let pendingError='Aguardando conexão.';
    if(navigator.onLine){
      let result:Awaited<ReturnType<typeof submitSaleAction>>|undefined;
      try{result=await submitSaleAction(saleData,activeSession.id,user.storeId);}catch{pendingError='Confirmação indisponível; reenvio protegido contra duplicidade.';}
      if(result?.ok){try{await db.removeQueuedSale(cacheScope,id);}catch{setOfflineSync(prev=>({...prev,error:'Venda confirmada. A limpeza local será repetida sem duplicar a venda.'}));}if(scopeRef.current===cacheScope){void refreshData();setOfflineSync(prev=>({...prev,items:prev.items.filter(i=>i.id!==id)}));}return result.sale;}
      if(result && !result.ok){if(result.confirmedRejected){await db.removeQueuedSale(cacheScope,id);throw new Error(result.error);}pendingError=result.error;}
    }
    try{await db.queueOfflineSale(cacheScope,{...item,lastError:pendingError});}catch{pendingError+=' Não foi possível atualizar o aviso local; o identificador original permanece na fila.';}
    if(scopeRef.current!==cacheScope)return {...saleData,id:'off-'+id,date:item.createdAt,status:'Pendente',cashRegisterSessionId:item.activeSessionId};
    setOfflineSync(prev=>({...prev,items:[...prev.items.filter(i=>i.id!==id),{...item,lastError:pendingError}]}));
    const localSale:Sale={...saleData,id:'off-'+id,date:item.createdAt,status:'Pendente',cashRegisterSessionId:activeSession.id,storeSnapshot:user.store};
    setSales(prev=>[localSale,...prev]);
    setProducts(prev=>{const updated=prev.map(p=>({...p,stock:Math.max(0,p.stock-(saleData.items.find(i=>i.productId===p.id)?.quantity??0))}));void db.saveToCache(cacheScope,'products',updated);return updated;});
    return localSale;
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

  const closeCashRegister = async (closingBalance: number, counted?:Record<string,number>) => {
    if (!activeSession) throw new Error("Nenhum caixa aberto para fechar.");
    await closeCashRegisterAction(activeSession.id, closingBalance, user?.storeId, counted);
    await refreshData();
  };

  const correctCashClosing = async (sessionId: string, newClosingBalance: number, reason:string) => {
    await correctCashClosingAction(sessionId, newClosingBalance, user?.storeId, reason);
    await refreshData();
  };

  const correctOpeningBalance = async (newOpeningBalance: number, reason:string) => {
    if (!activeSession) throw new Error("Não há caixa ativo para corrigir.");
    await correctOpeningBalanceAction(activeSession.id, newOpeningBalance, user?.storeId, reason);
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

  const updateUserRole = async (uid: string, role: User['role'], reason:string) => {
    await updateUserRoleAction(uid, role, user?.storeId, reason);
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
      receivePurchaseOrder, login, logout, reloadUser, dataError, dataPage, syncOfflineSales, offlineSync, retryData:refreshData
    }}>
      {children}
      {user?.storeId && <OfflineSyncPanel />}
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
