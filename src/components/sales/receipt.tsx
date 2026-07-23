

'use client';

import { Logo } from '@/components/icons/logo';
import type { Sale } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReceiptProps {
  sale: Sale;
}

export function Receipt({ sale }: ReceiptProps) {
  return (
    <div className="bg-background text-foreground p-4 font-mono text-sm">
      <div className="text-center mb-4">
        <Logo className="w-12 h-12 mx-auto mb-2 text-primary" />
        <h2 className="text-lg font-bold">Alvorada Smart Market</h2>
        <p className="text-xs">Avenida Principal, 123 - Centro</p>
        <p className="text-xs">CNPJ: 12.345.678/0001-99</p>
      </div>

      <div className="text-xs mb-2">
        <div className="border-t border-dashed border-foreground pt-2"></div>
        <div className="py-2">
            <p>Data: {format(new Date(sale.date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
            <p>Venda ID: {sale.id}</p>
            <p>Cliente: {sale.customerName}</p>
        </div>
        <div className="border-t border-dashed border-foreground"></div>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-dashed border-foreground">
            <th className="text-left font-bold py-1">Item</th>
            <th className="text-center font-bold py-1">Qtd</th>
            <th className="text-right font-bold py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map(item => (
            <tr key={item.productId} className="align-top">
              <td className="py-1">
                {item.productName}
                <br />
                <span className="text-muted-foreground">(R$ {item.price.toFixed(2).replace('.', ',')})</span>
              </td>
              <td className="text-center py-1">{item.quantity}</td>
              <td className="text-right py-1">R$ {(item.quantity * item.price).toFixed(2).replace('.', ',')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-xs my-2">
        <div className="border-t border-dashed border-foreground"></div>
      </div>
      
       <div className="space-y-1 text-xs">
          {sale.paymentMethods.map((p, i) => (
            <div key={i} className="flex justify-between">
              <span>Pagamento ({p.method}):</span>
              <span>R$ {p.amount.toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
      </div>

      <div className="text-right font-bold mt-2 text-base">
        <p>TOTAL: R$ {sale.total.toFixed(2).replace('.', ',')}</p>
      </div>

      <div className="text-center mt-4 text-xs">
        <p>Obrigado pela sua preferência!</p>
        <p className="font-bold">*** Este não é um documento fiscal ***</p>
      </div>
    </div>
  );
}
