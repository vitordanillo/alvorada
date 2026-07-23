

import type { Sale } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RecentSalesProps {
  sales: Sale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  // Filtra apenas vendas concluídas e ordena da mais recente para a mais antiga
  const concludedSales = sales.filter(s => s.status === 'Concluída');
  const sortedSales = [...concludedSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const getPaymentMethodsString = (payments: Sale['paymentMethods']) => {
    if (!payments || payments.length === 0) return 'N/A';
    if (payments.length === 1) return payments[0].method;
    return 'Múltiplo';
  };

  return (
    <div className="space-y-8">
      {sortedSales.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center pt-10">Nenhuma venda registrada ainda.</p>
      ) : (
        sortedSales.slice(0, 5).map((sale) => (
          <div className="flex items-center" key={sale.id}>
            <Avatar className="h-9 w-9">
              <AvatarImage src={`https://placehold.co/40x40.png?text=${sale.customerName.charAt(0)}`} alt="Avatar" data-ai-hint="person avatar" />
              <AvatarFallback>{sale.customerName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{sale.customerName}</p>
              <p className="text-sm text-muted-foreground">{getPaymentMethodsString(sale.paymentMethods)}</p>
            </div>
            <div className="ml-auto font-medium font-headline">
              + R$ {sale.total.toFixed(2).replace('.', ',')}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
