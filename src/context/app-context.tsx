'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Product, Customer, Sale, Supplier, User, CashRegisterSession, CashTransaction, StockAdjustmentLog, SystemSettings, StockEntryLog, ProductChangeLog, AccountsPayable, PurchaseOrder } from '@/lib/types';
import type { ProductFormData } from '@/components/products/product-form';
import {
  getCurrentUserAction,
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
  updateCancellationPassword: (newPassword: string) => Promise<void>;
  addPayable: (payable: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => Promise<void>;
  updatePayable: (payableId: string, data: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => Promise<void>;
  deletePayable: (payableId: string) => Promise<void>;
  markPayableAsPaid: (payableId: string, fromCashRegister: boolean) => Promise<void>;
  addPurchaseOrder: (orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy'>) => Promise<string>;
  updatePurchaseOrder: (orderId: string, orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy'>) => Promise<void>;
  receivePurchaseOrder: (orderId: string, receivedItems: { productId: string, productName: string, quantityReceived: number, cost: number }[]) => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
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

  const refreshData = async () => {
    if (!user) return;
    try {
      const data = await getInitialDataAction(user.role);
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
      console.error("Error refreshing data:", error);
    }
  };

  // On mount: Check auth session
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

  // On user change: Load or clear database listings
  useEffect(() => {
    if (user) {
      refreshData();
    } else {
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
    }
  }, [user]);

  // Load transactions for the active register session
  useEffect(() => {
    if (activeSession) {
      setLoading(prev => ({ ...prev, cashTransactions: true }));
      getCashTransactionsAction(activeSession.id)
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
    await addProductAction(productData);
    await refreshData();
  };

  const updateProduct = async (updatedProductData: Product) => {
    if (!user) throw new Error("Usuário não autenticado.");
    await updateProductAction(updatedProductData, { uid: user.uid, name: user.name });
    await refreshData();
  };
  
  const setProductStatus = async (productId: string, status: 'Ativo' | 'Inativo') => {
    await setProductStatusAction(productId, status);
    await refreshData();
  };

  const addStockToProducts = async (items: { productId: string, quantity: number, cost: number }[], supplier: { id: string, name: string }) => {
    if (!user) throw new Error("Usuário não autenticado.");
    await addStockToProductsAction(items, supplier, { uid: user.uid, name: user.name });
    await refreshData();
  };

  const adjustStock = async (productId: string, newQuantity: number, reason: StockAdjustmentLog['reason'], notes?: string) => {
    if (!user) throw new Error("Usuário não autenticado.");
    await adjustStockAction(productId, newQuantity, reason, notes || '', { uid: user.uid, name: user.name });
    await refreshData();
  };

  const addCustomer = async (customerData: Omit<Customer, 'id'|'balance'>) => {
    await addCustomerAction(customerData);
    await refreshData();
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    await updateCustomerAction(updatedCustomer);
    await refreshData();
  };
  
  const deleteCustomer = async (customerId: string) => {
    await deleteCustomerAction(customerId);
    await refreshData();
  };

  const addCreditPayment = async (customerId: string, amount: number): Promise<CashTransaction> => {
    if (!activeSession) throw new Error("Não há um caixa aberto. Impossível registrar o pagamento.");
    if (!user) throw new Error("Usuário não autenticado.");

    const transaction = await addCreditPaymentAction(customerId, amount, activeSession.id, { uid: user.uid, name: user.name });
    await refreshData();
    
    // Refresh cash transactions list
    const trans = await getCashTransactionsAction(activeSession.id);
    setCashTransactions(trans);

    return transaction;
  };

  const addSale = async (saleData: Omit<Sale, 'id' | 'date' | 'status'>): Promise<Sale> => {
    if (!activeSession) throw new Error("Não há um caixa aberto. Impossível registrar a venda.");
    if (!user) throw new Error("Usuário não autenticado.");

    const sale = await addSaleAction(saleData, activeSession.id, { uid: user.uid, name: user.name });
    await refreshData();

    // Refresh cash transactions list
    const trans = await getCashTransactionsAction(activeSession.id);
    setCashTransactions(trans);

    return sale;
  };

  const cancelSale = async (saleId: string, reason: string, passwordAttempt: string) => {
    if (!user) throw new Error("Usuário não autenticado.");
    await cancelSaleAction(saleId, reason, passwordAttempt, { uid: user.uid, name: user.name });
    await refreshData();

    if (activeSession) {
      const trans = await getCashTransactionsAction(activeSession.id);
      setCashTransactions(trans);
    }
  };

  const openCashRegister = async (openingBalance: number) => {
    if (!user) throw new Error("Usuário não autenticado para abrir o caixa.");
    await openCashRegisterAction(openingBalance, { uid: user.uid, name: user.name });
    await refreshData();
  };

  const closeCashRegister = async (closingBalance: number) => {
    if (!activeSession) throw new Error("Nenhum caixa aberto para fechar.");
    if (!user) throw new Error("Usuário não autenticado para fechar o caixa.");
    await closeCashRegisterAction(activeSession.id, closingBalance, { uid: user.uid, name: user.name });
    await refreshData();
  };

  const correctCashClosing = async (sessionId: string, newClosingBalance: number) => {
    if (!user) throw new Error("Usuário não autenticado para corrigir o caixa.");
    await correctCashClosingAction(sessionId, newClosingBalance, { uid: user.uid, name: user.name });
    await refreshData();
  };

  const correctOpeningBalance = async (newOpeningBalance: number) => {
    if (!activeSession) throw new Error("Não há caixa ativo para corrigir.");
    if (!user) throw new Error("Usuário não autenticado.");
    await correctOpeningBalanceAction(activeSession.id, newOpeningBalance, { uid: user.uid, name: user.name });
    await refreshData();
  };

  const reopenCashRegister = async (sessionId: string) => {
    await reopenCashRegisterAction(sessionId);
    await refreshData();
  };

  const cancelCashRegisterOpening = async (sessionId: string) => {
    await cancelCashRegisterOpeningAction(sessionId);
    await refreshData();
  };

  const addCashTransaction = async (transactionData: Omit<CashTransaction, 'id' | 'date' | 'sessionId' | 'registeredBy'>) => {
    if (!activeSession) throw new Error("Nenhum caixa ativo.");
    if (!user) throw new Error("Usuário não autenticado.");
    await addCashTransactionAction(transactionData, activeSession.id, { uid: user.uid, name: user.name });
    await refreshData();

    const trans = await getCashTransactionsAction(activeSession.id);
    setCashTransactions(trans);
  };

  const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    await addSupplierAction(supplierData);
    await refreshData();
  };
  
  const updateSupplier = async (updatedSupplier: Supplier) => {
    await updateSupplierAction(updatedSupplier);
    await refreshData();
  };
  
  const deleteSupplier = async (supplierId: string) => {
    await deleteSupplierAction(supplierId);
    await refreshData();
  };

  const updateUserRole = async (uid: string, role: User['role']) => {
    await updateUserRoleAction(uid, role);
    await refreshData();
  };
  
  const updateCancellationPassword = async (newPassword: string) => {
    await updateCancellationPasswordAction(newPassword);
    await refreshData();
  };

  const addPayable = async (payableData: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => {
    if (!user) throw new Error("Usuário não autenticado.");
    await addPayableAction(payableData, { uid: user.uid, name: user.name });
    await refreshData();
  };

  const updatePayable = async (payableId: string, data: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => {
    await updatePayableAction(payableId, data);
    await refreshData();
  };
  
  const deletePayable = async (payableId: string) => {
    await deletePayableAction(payableId);
    await refreshData();
  };

  const markPayableAsPaid = async (payableId: string, fromCashRegister: boolean) => {
    if (!user) throw new Error("Usuário não autenticado.");
    await markPayableAsPaidAction(payableId, fromCashRegister, activeSession ? activeSession.id : null, { uid: user.uid, name: user.name });
    await refreshData();

    if (activeSession && fromCashRegister) {
      const trans = await getCashTransactionsAction(activeSession.id);
      setCashTransactions(trans);
    }
  };

  const addPurchaseOrder = async (orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy'>) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const orderId = await addPurchaseOrderAction(orderData, { uid: user.uid, name: user.name });
    await refreshData();
    return orderId;
  };
  
  const updatePurchaseOrder = async (orderId: string, orderData: Omit<PurchaseOrder, 'id' | 'dateCreated' | 'status' | 'registeredBy' | 'items' | 'totalCost'> & { items: any; totalCost: any}) => {
    await updatePurchaseOrderAction(orderId, orderData);
    await refreshData();
  };

  const receivePurchaseOrder = async (orderId: string, receivedItems: { productId: string, productName: string, quantityReceived: number, cost: number }[]) => {
    if (!user) throw new Error("Usuário não autenticado.");
    await receivePurchaseOrderAction(orderId, receivedItems, { uid: user.uid, name: user.name });
    await refreshData();
  };

  const login = async (email: string, password: string) => {
    const loggedUser = await loginUserAction(email, password);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (name: string, email: string, password: string) => {
    const newUser = await registerUserAction(name, email, password);
    setUser(newUser);
    return newUser;
  };

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
      addCashTransaction, addSupplier, updateSupplier, deleteSupplier, updateUserRole, updateCancellationPassword,
      addPayable, updatePayable, deletePayable, markPayableAsPaid, addPurchaseOrder, updatePurchaseOrder,
      receivePurchaseOrder, login, register, logout
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
