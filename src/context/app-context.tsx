'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {dataPlan} from '@/lib/data-plan';
import { usePathname, useSearchParams } from 'next/navigation';
import { newRequestId } from '@/lib/request-id';
import type { OfflineSale } from '@/lib/offline-db';
import type {OfflineOperation} from '@/lib/offline-operation-types';
import {operationLabels} from '@/lib/offline-operation-types';
import {getServiceDataAction} from '@/lib/service-actions';
import {submitOfflineOperationAction} from '@/lib/offline-operation-actions';
import {validateOfflineOperation} from '@/lib/offline-validation';
import {projectService} from '@/lib/offline-service-projection';
import {projectOperations, type OfflineSnapshot} from '@/lib/offline-projection';
import {rememberOfflineUser,readOfflineUser,forgetOfflineUser,serverReachable} from '@/lib/offline-session';
import {OfflineRuntime} from '@/components/layout/offline-runtime';
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
  offlineOperations:OfflineOperation[];
  isOffline:boolean;
  executeOfflineOperation:(kind:string,args:any[])=>Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const pathname=usePathname(),searchParams=useSearchParams();
  const [dataPage,setDataPage]=useState({main:'',page:1,pageSize:50,total:0,catalogLimited:false});
  const [dataError,setDataError]=useState('');
  const [offlineSync,setOfflineSync]=useState({items:[] as OfflineSale[],syncing:false,lastSync:'',error:''});
  const [offlineOperations,setOfflineOperations]=useState<OfflineOperation[]>([]);
  const [isOffline,setIsOffline]=useState(false);
  const baseRef=React.useRef<OfflineSnapshot>({});
  const operationLock=React.useRef<Promise<unknown>>(Promise.resolve());
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

  const hydrate=(snapshot:OfflineSnapshot,operations:OfflineOperation[])=>{
    if(!user)return;
    const data=projectOperations(snapshot,operations,user);
    setProducts(data.products??[]);setCustomers(data.customers??[]);setSales(data.sales??[]);setSuppliers(data.suppliers??[]);
    setCashSessions(data.cashSessions??[]);setCashTransactions(data.cashTransactions??[]);setStockAdjustmentLogs(data.stockAdjustmentLogs??[]);
    setAllUsers(data.allUsers??[]);setSystemSettings(data.systemSettings??null);setStockEntryLogs(data.stockEntryLogs??[]);
    setProductChangeLogs(data.productChangeLogs??[]);setAccountsPayable(data.accountsPayable??[]);setPurchaseOrders(data.purchaseOrders??[]);
    setLoading(prev=>Object.fromEntries(Object.keys(prev).map(key=>[key,false])) as typeof prev);
  };
  const refreshData=async()=>{
    if(!user?.storeId||user.mustChangePassword)return;
    const scope=cacheScope,version=++requestVersion.current;
    const db=await import('@/lib/offline-db');
    let snapshot=await db.getFromCache<OfflineSnapshot>(scope,'snapshot');
    const operations=await db.getOperations(scope);
    if(scopeRef.current!==scope||version!==requestVersion.current)return;
    if(snapshot){baseRef.current=snapshot;setOfflineOperations(operations);hydrate(snapshot,operations);}
    if(await serverReachable()){
      try{
        const [full,page]=await Promise.all([getInitialDataAction(user.storeId,'/offline'),getInitialDataAction(user.storeId,pathname,Number(searchParams.get('page')??1),searchParams.get('search')??'',searchParams.get('from')??'',searchParams.get('to')??'')]);
        const cash=full.cashSessions.find(s=>s.status==='Aberto');
        const transactions=cash?await getCashTransactionsAction(cash.id,user.storeId):[];
                const serviceData=user.store?.enabledModules?.includes('mesas_fichas')&&user.role!=='Estoquista'?await getServiceDataAction(user.storeId).catch(()=>undefined):undefined;
        snapshot={...full,cashTransactions:transactions,serviceData};
        if(serviceData)await db.saveToCache(scope,'service:base',serviceData);
        if(scopeRef.current!==scope||version!==requestVersion.current)return;
        await db.saveToCache(scope,'snapshot',snapshot);
        await db.saveToCache(scope,'page:'+pathname+'?'+searchParams.toString(),page);
        baseRef.current=snapshot;const current=await db.getOperations(scope);setOfflineOperations(current);
        // Pending operations use the complete local catalog, including records just created locally.
        hydrate(current.length?snapshot:{...snapshot,...page,cashTransactions:transactions},current);
        setDataPage(page.meta);setDataError('');setIsOffline(false);return;
      }catch{/* Preserve the last durable snapshot when the server is unreachable. */}
    }
    if(scopeRef.current!==scope||version!==requestVersion.current)return;
    setIsOffline(true);
    if(snapshot){
      const main=dataPlan(pathname).main;
      const local=projectOperations(snapshot,operations,user),query=(searchParams.get('search')??'').toLocaleLowerCase();
      let rows=main?(local[main]??[]):[];
      if(query)rows=rows.filter((r:any)=>Object.values(r).some(v=>typeof v==='string'&&v.toLocaleLowerCase().includes(query)));
      if(main==='sales'&&(searchParams.get('from')||searchParams.get('to')))rows=rows.filter((r:any)=>{const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(r.date));return (!searchParams.get('from')||day>=searchParams.get('from')!)&&(!searchParams.get('to')||day<=searchParams.get('to')!);});
      const page=Math.max(1,Number(searchParams.get('page')??1)),total=rows.length;
      const display=main?{...local,[main]:rows.slice((page-1)*50,page*50)}:local;
      hydrate(display,[]);
      setDataPage({main,page,pageSize:50,total,catalogLimited:!!snapshot.meta?.catalogLimited});
      setDataError('');
    }else{setDataError('Este dispositivo ainda não tem os dados desta loja. Conecte uma vez para preparar a operação offline.');setLoading(prev=>Object.fromEntries(Object.keys(prev).map(key=>[key,false])) as typeof prev);}
  };
  const executeOfflineOperation=(kind:string,args:any[]):Promise<any>=>{
    const run=async()=>{
      if(!user?.storeId||!operationLabels[kind])throw new Error('Selecione uma loja para continuar.');
      if(baseRef.current.store?.id!==user.storeId)throw new Error('Aguarde a preparação dos dados desta loja antes de registrar operações.');
      const scope=cacheScope,db=await import('@/lib/offline-db');
      const id=kind==='sale'&&/^[a-f0-9-]{36}$/i.test(args[0]?.clientRequestId??'')?args[0].clientRequestId:newRequestId();const item:OfflineOperation={id,storeId:user.storeId,userId:user.uid,kind,args:JSON.parse(JSON.stringify(args)),createdAt:new Date().toISOString(),sequence:Date.now()*1000,attempts:0,state:'pending'};
      if(kind==='sale')item.args=[{...args[0],clientRequestId:args[0].clientRequestId??id},args[1]];
      const currentOperations=await db.getOperations(scope),current=projectOperations(baseRef.current,currentOperations,user);
      validateOfflineOperation(kind,item.args,current,user);
      const guardPlans:Record<string,[string,string,string,string[]]>={correctClosing:['cashRegisterSession','cashSessions',args[0],['status','closingBalance']],correctOpening:['cashRegisterSession','cashSessions',args[0],['status','openingBalance','calculatedCashInDrawer']],reopenCash:['cashRegisterSession','cashSessions',args[0],['status','closingBalance']],cancelOpening:['cashRegisterSession','cashSessions',args[0],['status','totalSales','calculatedCashInDrawer']],updateProduct:['product','products',args[0]?.id,['stock','price','averageCost','status']],adjustStock:['product','products',args[0],['stock','price','averageCost','status']],updateCustomer:['customer','customers',args[0]?.id,['balance','creditLimit']],closeCash:['cashRegisterSession','cashSessions',args[0],['status','totalSales','calculatedCashInDrawer']],updatePayable:['accountsPayable','accountsPayable',args[0],['status','amount']],markPayablePaid:['accountsPayable','accountsPayable',args[0],['status','amount']],updatePurchaseOrder:['purchaseOrder','purchaseOrders',args[0],['status']]};
      const guard=guardPlans[kind];if(guard){const row=current[guard[1]]?.find((r:any)=>r.id===guard[2]);if(row)item.guard={entity:guard[0],id:guard[2],values:Object.fromEntries(guard[3].map(k=>[k,row[k]??null]))};}
      const serviceBase=await db.getFromCache<any>(scope,'service:base');
      const before=projectService(serviceBase,await db.getOperations(scope),user,projectOperations(baseRef.current,await db.getOperations(scope),user)).data;
      const reachable=await serverReachable();
      if(kind==='redeemTicket'&&!reachable){
        const ticket=before.tickets.find((t:any)=>t.code===args[0].trim().toUpperCase());
        if(!ticket||ticket.status!=='Pendente')throw new Error('Ficha não encontrada no dispositivo ou já retirada.');
      }
      if(kind==='issueTickets'&&!reachable){const target=before.sales.find((s:any)=>s.id===args[0])??current.sales?.find((s:any)=>s.id===args[0]);if(!target||target.items.some((i:any)=>!Number.isInteger(i.quantity)))throw new Error('Esta venda não está disponível para fichas neste dispositivo. Conecte para consultá-la.');}
      const units=kind==='purchaseTickets'?args[0].quantity:kind==='issueTickets'?(before.sales.find((s:any)=>s.id===args[0])?.items??[]).reduce((n:number,i:any)=>n+i.quantity,0):0;
      if(units){if(!Number.isInteger(units)||units<1||units>200)throw new Error('Fichas exigem de 1 a 200 unidades.');item.ticketCodes=Array.from({length:units},()=> 'F-'+newRequestId().replaceAll('-','').slice(0,16).toUpperCase());}
      const existing=(await db.getOperations(scope)).find(op=>op.id===id);
      if(existing){
        if(JSON.stringify(existing.args)!==JSON.stringify(item.args))throw new Error('Já existe uma venda pendente para este carrinho. Consulte a sincronização antes de registrar novamente.');
        Object.assign(item,existing);
      }
      await db.queueOperation(scope,item);
      let operations=await db.getOperations(scope);
      // Submit only the head of the queue so dependent records are committed in order.
      if(operations[0]?.id===id&&reachable){
        let result:Awaited<ReturnType<typeof submitOfflineOperationAction>>|undefined;
        try{result=await submitOfflineOperationAction(item);}catch{/* Unknown result is retained and retried with the same ID. */}
        if(result?.ok){await db.removeOperation(scope,id);if(scopeRef.current===scope)await refreshData();return result.result??(kind==='addPurchaseOrder'||kind==='openTab'?id:undefined);}
        if(result&&!result.ok&&result.confirmedRejected){await db.removeOperation(scope,id);throw new Error(result.error);}
      }
      if(scopeRef.current!==scope)throw new Error('Operação salva na loja anterior. Retorne a ela para acompanhar a sincronização.');
      operations=await db.getOperations(scope);setOfflineOperations(operations);hydrate(baseRef.current,operations);setIsOffline(true);
      window.dispatchEvent(new Event('alvorada-operations-changed'));
      const projected=projectOperations(baseRef.current,operations,user);
      if(kind==='sale')return projected.sales.find((r:any)=>r.id===id);
      if(kind==='addCreditPayment')return projected.cashTransactions.find((r:any)=>r.id===id);
      if(kind==='addPurchaseOrder'||kind==='openTab')return id;
      if(['closeTab','purchaseTickets','issueTickets','redeemTicket'].includes(kind))return projectService(serviceBase,operations,user,projected).result;
      return undefined;
    };
    const promise=operationLock.current.then(run,run);operationLock.current=promise.catch(()=>{});return promise;
  };
  // Synchronize offline sales queue
  const syncOfflineSales = async () => {
    if(!user?.storeId || syncLock.current||!navigator.onLine)return;
    const scope=cacheScope,storeId=user.storeId;syncLock.current=true;
    setOfflineSync(prev=>({...prev,syncing:true,error:''}));
    try{
      const db=await import('@/lib/offline-db');
      const legacy=await db.getLegacyQueuedSales();
      if(legacy.length){const owned=await getLegacyOfflineSessionsAction([...new Set(legacy.map(s=>s.activeSessionId))],storeId);await db.recoverLegacySales(scope,legacy.filter(s=>owned.includes(s.activeSessionId)));}
      const queued=await db.getQueuedSales(scope);let accepted=0;
      if(!await serverReachable()){setIsOffline(true);return;}
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
      for(const operation of (await db.getQueuedSales(scope)).length?[]:await db.getOperations(scope)){
        if(scopeRef.current!==scope||!navigator.onLine)break;
        if(operation.state==='conflict')break;
        try{
          const result=await submitOfflineOperationAction(operation);
          if(result.ok){await db.removeOperation(scope,operation.id);accepted++;}
          else{await db.queueOperation(scope,{...operation,attempts:operation.attempts+1,lastError:result.error,state:result.confirmedRejected?'conflict':'pending'});break;}
        }catch{await db.queueOperation(scope,{...operation,attempts:operation.attempts+1,lastError:'Sem confirmação. Reenvio preserva o identificador original.'});break;}
      }
      if(scopeRef.current===scope){setOfflineOperations(await db.getOperations(scope));setIsOffline(false);window.dispatchEvent(new Event('alvorada-operations-changed'));}
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
        rememberOfflineUser(currentUser);setUser(currentUser);
      })
      .catch((err) => {
        console.error("Error loading auth status:", err);
        setUser(readOfflineUser());setIsOffline(true);
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
      const timer=window.setInterval(()=>{if(navigator.onLine)void syncOfflineSales();},30000);
      if (navigator.onLine && user) {
        syncOfflineSales();
      }
      return () => {
        window.clearInterval(timer);window.removeEventListener('online', syncOfflineSales);
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

  const requireOnline=async()=>{if(!await serverReachable())throw new Error('Esta ação exige conexão para validar a autorização no servidor. As operações da loja permanecem salvas.');};
  // Mutations
  const addProduct = async (productData: ProductFormData) => {
    await executeOfflineOperation('addProduct',[productData]);
    if(!isOffline)await refreshData();
  };

  const updateProduct = async (updatedProductData: Product) => {
    await executeOfflineOperation('updateProduct',[updatedProductData]);
    if(!isOffline)await refreshData();
  };
  
  const setProductStatus = async (productId: string, status: 'Ativo' | 'Inativo') => {
    await executeOfflineOperation('setProductStatus',[productId, status]);
    if(!isOffline)await refreshData();
  };

  const addStockToProducts = async (items: { productId: string, quantity: number, cost: number }[], supplier: { id: string, name: string }) => {
    await executeOfflineOperation('addStock',[items, supplier]);
    if(!isOffline)await refreshData();
  };

  const adjustStock = async (productId: string, newQuantity: number, reason: StockAdjustmentLog['reason'], notes?: string) => {
    await executeOfflineOperation('adjustStock',[productId, newQuantity, reason, notes || '']);
    if(!isOffline)await refreshData();
  };

  const addCustomer = async (customerData: Omit<Customer, 'id'|'balance'>) => {
    await executeOfflineOperation('addCustomer',[customerData]);
    if(!isOffline)await refreshData();
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    await executeOfflineOperation('updateCustomer',[updatedCustomer]);
    if(!isOffline)await refreshData();
  };
  
  const deleteCustomer = async (customerId: string) => {
    await executeOfflineOperation('deleteCustomer',[customerId]);
    if(!isOffline)await refreshData();
  };

  const addCreditPayment = async (customerId: string, amount: number): Promise<CashTransaction> => {
    if (!activeSession) throw new Error("Não há um caixa aberto. Impossível registrar o pagamento.");

    const transaction = await executeOfflineOperation('addCreditPayment',[customerId,amount,activeSession.id]);
    if(!isOffline)await refreshData();
    
    // Refresh cash transactions list

    return transaction;
  };

  const addSale=async(input:Omit<Sale,'id'|'date'|'status'>):Promise<Sale>=>{
    if(!activeSession||!user?.storeId)throw new Error('Abra o caixa antes de registrar a venda.');
    return executeOfflineOperation('sale',[input,activeSession.id]);
  };
  const cancelSale = async (saleId: string, reason: string, passwordAttempt: string) => {
    await requireOnline();
    await cancelSaleAction(saleId, reason, passwordAttempt, user?.storeId);
    if(!isOffline)await refreshData();

    if (activeSession) {
    }
  };

  const openCashRegister = async (openingBalance: number) => {
    await executeOfflineOperation('openCash',[openingBalance]);
    if(!isOffline)await refreshData();
  };

  const closeCashRegister = async (closingBalance: number, counted?:Record<string,number>) => {
    if (!activeSession) throw new Error("Nenhum caixa aberto para fechar.");
    await executeOfflineOperation('closeCash',[activeSession.id,closingBalance,counted??null]);
    if(!isOffline)await refreshData();
  };

  const correctCashClosing = async (sessionId: string, newClosingBalance: number, reason:string) => {
    await executeOfflineOperation('correctClosing',[sessionId,newClosingBalance,reason]);
    if(!isOffline)await refreshData();
  };

  const correctOpeningBalance = async (newOpeningBalance: number, reason:string) => {
    if (!activeSession) throw new Error("Não há caixa ativo para corrigir.");
    await executeOfflineOperation('correctOpening',[activeSession.id,newOpeningBalance,reason]);
    if(!isOffline)await refreshData();
  };

  const reopenCashRegister = async (sessionId: string) => {
    await executeOfflineOperation('reopenCash',[sessionId]);
    if(!isOffline)await refreshData();
  };

  const cancelCashRegisterOpening = async (sessionId: string) => {
    await executeOfflineOperation('cancelOpening',[sessionId]);
    if(!isOffline)await refreshData();
  };

  const addCashTransaction = async (transactionData: Omit<CashTransaction, 'id' | 'date' | 'sessionId' | 'registeredBy'>) => {
    if (!activeSession) throw new Error("Nenhum caixa ativo.");
    await executeOfflineOperation('addCashTransaction',[transactionData,activeSession.id]);
    if(!isOffline)await refreshData();
  };

  const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    await executeOfflineOperation('addSupplier',[supplierData]);
    if(!isOffline)await refreshData();
  };
  
  const updateSupplier = async (updatedSupplier: Supplier) => {
    await executeOfflineOperation('updateSupplier',[updatedSupplier]);
    if(!isOffline)await refreshData();
  };
  
  const deleteSupplier = async (supplierId: string) => {
    await executeOfflineOperation('deleteSupplier',[supplierId]);
    if(!isOffline)await refreshData();
  };

  const updateUserRole = async (uid: string, role: User['role'], reason:string) => {
    await requireOnline();
    await updateUserRoleAction(uid, role, user?.storeId, reason);
    if(!isOffline)await refreshData();
  };

  const createUser = async (name: string, email: string, password: string, role: User['role']) => {
    await requireOnline();
    const created = await createUserAction(name, email, password, role, user?.storeId);
    setAllUsers((current) => [...current, created]);
  };
  
  const updateCancellationPassword = async (newPassword: string) => {
    await requireOnline();
    await updateCancellationPasswordAction(newPassword, user?.storeId);
    if(!isOffline)await refreshData();
  };

  const addPayable = async (payableData: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => {
    await executeOfflineOperation('addPayable',[payableData]);
    if(!isOffline)await refreshData();
  };

  const updatePayable = async (payableId: string, data: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => {
    await executeOfflineOperation('updatePayable',[payableId, data]);
    if(!isOffline)await refreshData();
  };
  
  const deletePayable = async (payableId: string) => {
    await executeOfflineOperation('deletePayable',[payableId]);
    if(!isOffline)await refreshData();
  };

  const markPayableAsPaid = async (payableId: string, fromCashRegister: boolean) => {
    await executeOfflineOperation('markPayablePaid',[payableId,fromCashRegister,activeSession?.id??null]);
    if(!isOffline)await refreshData();

    if (activeSession && fromCashRegister) {
    }
  };

  const addPurchaseOrder = async (orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy'>) => {
    const orderId = await executeOfflineOperation('addPurchaseOrder',[orderData]);
    if(!isOffline)await refreshData();
    return orderId;
  };
  
  const updatePurchaseOrder = async (orderId: string, orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy' | 'items' | 'totalCost'> & { items: any; totalCost: any}) => {
    await executeOfflineOperation('updatePurchaseOrder',[orderId, orderData]);
    if(!isOffline)await refreshData();
  };

  const receivePurchaseOrder = async (orderId: string, receivedItems: { productId: string, productName: string, quantityReceived: number, cost: number }[]) => {
    await executeOfflineOperation('receivePurchaseOrder',[orderId, receivedItems]);
    if(!isOffline)await refreshData();
  };

  const login = async (email: string, password: string) => {
    const loggedUser = await loginUserAction(email, password);
    rememberOfflineUser(loggedUser);setUser(loggedUser);
    return loggedUser;
  };

  const reloadUser = async () => { if(!await serverReachable())return;const current=await getCurrentUserAction();rememberOfflineUser(current);setUser(current); };

  const logout = async () => {
    forgetOfflineUser();if(navigator.onLine)await logoutUserAction();
    setUser(null);setOfflineOperations([]);baseRef.current={};
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
      receivePurchaseOrder, login, logout, reloadUser, dataError, dataPage, syncOfflineSales, offlineSync, offlineOperations, isOffline, executeOfflineOperation, retryData:refreshData
    }}>
      <OfflineRuntime />{children}
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
