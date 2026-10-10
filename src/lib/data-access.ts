import type {User} from './types';
export function restrictDataPlan(role:User['role'], plan:{main:string;needed:Set<string>}){
  const manager=role==='Administrador'||role==='Gerente';
  const stock=manager||role==='Estoquista';
  const cashier=manager||role==='Operador de Caixa';
  const allowed=new Set(['products',...(cashier?['customers','cashSessions']:[]),...(manager?['sales','accountsPayable']:[]),...(stock?['suppliers','purchaseOrders','stockAdjustmentLogs','stockEntryLogs','productChangeLogs']:[]),...(role==='Administrador'?['allUsers','systemSettings']:[])]);
  if(plan.main&&!allowed.has(plan.main))throw new Error('Acesso negado a esta área.');
  return {main:plan.main,needed:new Set([...plan.needed].filter(key=>allowed.has(key)))};
}
