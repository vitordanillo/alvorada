export function dataPlan(path:string){
 const main=path==='/dashboard/products'?'products':path==='/dashboard/customers'?'customers':path==='/dashboard/sales'?'sales':path==='/dashboard/suppliers'?'suppliers':path==='/dashboard/accounts-payable'?'accountsPayable':path==='/dashboard/purchase-orders'?'purchaseOrders':path==='/dashboard/cash-register'?'cashSessions':'';
 const needed=new Set<string>(['cashSessions']);
 if(path==='/offline')for(const key of ['products','customers','sales','suppliers','stockAdjustmentLogs','stockEntryLogs','productChangeLogs','accountsPayable','purchaseOrders','allUsers','systemSettings'])needed.add(key);
 if(path==='/pos'){needed.add('products');needed.add('customers');}
 else if(path.startsWith('/dashboard/products')){needed.add('products');needed.add('suppliers');}
 else if(path.startsWith('/dashboard/customers'))needed.add('customers');
 else if(path.startsWith('/dashboard/sales'))needed.add('sales');
 else if(path.startsWith('/dashboard/suppliers'))needed.add('suppliers');
 else if(path.startsWith('/dashboard/accounts-payable')){needed.add('accountsPayable');needed.add('suppliers');}
 else if(path.startsWith('/dashboard/purchase-orders')){needed.add('purchaseOrders');needed.add('products');needed.add('suppliers');}
 else if(path.startsWith('/dashboard/inventory/')){needed.add('products');needed.add('suppliers');if(path.endsWith('/restock'))needed.add('sales');}
 else if(path.startsWith('/dashboard/logs'))for(const key of ['stockAdjustmentLogs','stockEntryLogs','productChangeLogs'])needed.add(key);
 else if(path.startsWith('/dashboard/settings')){needed.add('allUsers');needed.add('systemSettings');}
 return {main,needed};
}
