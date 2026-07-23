

export type Product = {
  id: string;
  name: string;
  sku: string;
  status: 'Ativo' | 'Inativo';
  category: 'Alimentos' | 'Limpeza' | 'Higiene' | 'Bebidas' | 'Outros';
  price: number;
  averageCost: number;
  costHistory: Array<{ date: string; quantity: number; cost: number }>;
  stock: number;
  minStock: number;
  unit: string;
  supplier: string;
  barcode?: string;
  imageUrl?: string;
};

export type Sale = {
  id: string;
  date: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    costAtTimeOfSale?: number;
  }[];
  total: number;
  totalCost?: number;
  totalProfit?: number;
  customerId: string;
  customerName: string;
  paymentMethods: Array<{
    method: 'Dinheiro' | 'Pix' | 'Cartão' | 'Fiado';
    amount: number;
  }>;
  cashRegisterSessionId?: string;
  status: 'Concluída' | 'Cancelada';
  cancellationReason?: string;
  cancelledBy?: {
    uid: string;
    name: string;
  };
  cancellationDate?: string; // ISO
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  creditLimit: number;
  balance: number;
  notes?: string;
  tags?: string[];
};

export type Supplier = {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
};

export type User = {
  uid: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Gerente' | 'Operador de Caixa' | 'Estoquista';
  avatarUrl?: string;
};

export type SystemSettings = {
  cancellationPassword?: string;
};

export type CashTransaction = {
  id: string;
  sessionId: string;
  type: 'Despesa' | 'Sangria' | 'Recebimento Fiado';
  amount: number;
  description: string;
  date: string; // ISO
  registeredBy: {
    uid: string;
    name: string;
  };
  customerId?: string;
  customerName?: string;
};

export type CashRegisterSession = {
  id: string;
  openingTime: string; // ISO
  closingTime: string | null; // ISO
  openingBalance: number; // initial cash
  closingBalance: number | null; // final cash counted by user
  
  // System calculated values
  calculatedCashInDrawer: number;
  totalSales: number;
  salesByPaymentMethod: {
    Dinheiro: number;
    Pix: number;
    Cartão: number;
  };
  totalExpenses: number;
  totalWithdrawals: number;
  totalCreditPayments: number;

  status: 'Aberto' | 'Fechado';
  openedBy: {
    uid: string;
    name: string;
  };
  closedBy: {
    uid: string;
    name: string;
  } | null;
  correction?: {
    date: string; // ISO
    user: { uid: string; name: string; };
    oldValue: number;
    newValue: number;
  },
  openingCorrection?: {
    date: string; // ISO
    user: { uid: string; name: string; };
    oldValue: number;
    newValue: number;
  }
};

export type StockAdjustmentLog = {
  id: string;
  productId: string;
  productName: string;
  adjustedBy: {
    uid: string;
    name: string;
  };
  date: string; // ISO
  oldQuantity: number;
  newQuantity: number;
  reason: 'Perda' | 'Avaria' | 'Contagem' | 'Doação' | 'Outro';
  notes?: string;
};

export type StockEntryLog = {
  id: string;
  date: string; // ISO
  supplierId: string;
  supplierName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    cost: number;
  }>;
  totalCost: number;
  totalItems: number;
  registeredBy: {
    uid: string;
    name: string;
  };
  purchaseOrderId?: string;
};

export type ProductChangeLog = {
  id: string;
  date: string; // ISO
  productId: string;
  productName:string;
  changedBy: {
    uid: string;
    name: string;
  };
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
};

export type AccountsPayable = {
  id: string;
  description: string;
  amount: number;
  dateCreated: string; // ISO
  dueDate: string; // ISO
  paymentDate: string | null; // ISO
  status: 'Pendente' | 'Pago' | 'Vencido';
  supplierId?: string;
  supplierName?: string;
  registeredBy: {
    uid: string;
    name: string;
  };
  cashSessionId?: string; // If paid from a cash register
};

export type PurchaseOrderItem = {
  productId: string;
  productName: string;
  quantityOrdered: number;
  cost: number;
  quantityReceived: number;
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  supplierName: string;
  dateCreated: string; // ISO
  dateExpected: string; // ISO
  dateReceived?: string; // ISO
  status: 'Pendente' | 'Recebido Parcialmente' | 'Recebido' | 'Cancelado';
  items: PurchaseOrderItem[];
  totalCost: number;
  registeredBy: {
    uid: string;
    name: string;
  };
  notes?: string;
};

export type StatCard = {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export type SalesData = {
  name: string;
  total: number;
};

export type CashFlowData = {
  date: string;
  entradas: number;
  saidas: number;
};
