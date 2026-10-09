
'use client';

import { useAppContext } from '@/context/app-context';
import { Logo } from '@/components/icons/logo';
import type { CashTransaction, Customer } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentReceiptProps {
  data: {
    transaction: CashTransaction;
    customer: Customer;
  };
}

export function PaymentReceipt({ data }: PaymentReceiptProps) {
  const { transaction, customer } = data;
  const { user }=useAppContext();
  const issuer=transaction.storeSnapshot ?? user?.store;
  const previousBalance = customer.balance;
  const newBalance = customer.balance - transaction.amount;

  return (
    <div className="bg-background text-foreground p-4 font-mono text-sm">
      <div className="text-center mb-4">
        <Logo className="w-12 h-12 mx-auto mb-2 text-primary" />
        <h2 className="text-lg font-bold">{issuer?.name ?? 'Loja'}</h2>
        {issuer?.address && <p className="text-xs">{issuer.address}</p>}
        {issuer?.cnpj && <p className="text-xs">CNPJ: {issuer.cnpj}</p>}
        {issuer?.phone && <p className="text-xs">{issuer.phone}</p>}
      </div>

      <div className="text-center mb-4">
        <h3 className="font-bold uppercase">Comprovante de Pagamento</h3>
      </div>

      <div className="text-xs mb-2">
        <div className="border-t border-dashed border-foreground pt-2"></div>
        <div className="py-2">
            <p>Data: {format(new Date(transaction.date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
            <p>Cliente: {transaction.customerName}</p>
        </div>
        <div className="border-t border-dashed border-foreground"></div>
      </div>

      <div className="space-y-1 text-xs my-4">
        <div className="flex justify-between">
            <span>Saldo Anterior:</span>
            <span>R$ {previousBalance.toFixed(2).replace('.', ',')}</span>
        </div>
         <div className="flex justify-between font-bold">
            <span>Valor Pago:</span>
            <span>R$ {transaction.amount.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex justify-between">
            <span>Novo Saldo:</span>
            <span>R$ {newBalance.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      <div className="text-center mt-4 text-xs">
        <p className="text-xs">Granzoti Sistemas · Firma Conecta</p>
        <p>Obrigado!</p>
        <p className="font-bold">*** Este não é um documento fiscal ***</p>
      </div>
    </div>
  );
}
