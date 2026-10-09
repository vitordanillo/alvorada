export type OfflineOperation = {
 id:string; storeId:string; userId:string; kind:string; args:any[]; createdAt:string;
 guard?:{entity:string;id:string;values:Record<string,unknown>}; ticketCodes?:string[]; sequence?:number; attempts:number; state:'pending'|'conflict'; lastError?:string;
};
export const operationLabels:Record<string,string>={
 correctClosing:'Correção de fechamento',correctOpening:'Correção de abertura',reopenCash:'Reabertura de caixa',cancelOpening:'Cancelamento de abertura',sale:'Venda',addProduct:'Cadastro de produto',updateProduct:'Alteração de produto',setProductStatus:'Situação do produto',addStock:'Entrada de estoque',adjustStock:'Ajuste de estoque',
 addCustomer:'Cadastro de cliente',updateCustomer:'Alteração de cliente',deleteCustomer:'Exclusão de cliente',addCreditPayment:'Recebimento de fiado',
 openCash:'Abertura de caixa',closeCash:'Fechamento de caixa',addCashTransaction:'Movimentação de caixa',addSupplier:'Cadastro de fornecedor',updateSupplier:'Alteração de fornecedor',deleteSupplier:'Exclusão de fornecedor',
 addPayable:'Conta a pagar',updatePayable:'Alteração de conta',deletePayable:'Exclusão de conta',markPayablePaid:'Pagamento de conta',addPurchaseOrder:'Pedido de compra',updatePurchaseOrder:'Alteração de pedido',receivePurchaseOrder:'Recebimento de pedido',
 saveTable:'Cadastro de mesa',openTab:'Abertura de mesa',addItem:'Consumo de mesa',removeItem:'Estorno de consumo',cancelTab:'Cancelamento de mesa',closeTab:'Fechamento de mesa',purchaseTickets:'Venda de fichas',issueTickets:'Emissão de fichas',redeemTicket:'Retirada de ficha'
};
