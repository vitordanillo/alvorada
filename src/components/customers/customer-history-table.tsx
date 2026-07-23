
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, Ban } from 'lucide-react';
import type { Sale } from '@/lib/types'; // Import Sale type to check status

export type HistoryItem = {
    id: string;
    date: string;
    type: 'compra' | 'pagamento';
    details: string;
    amount: number;
    status?: Sale['status']; // Add optional status
};

interface CustomerHistoryTableProps {
  history: HistoryItem[];
}

export function CustomerHistoryTable({ history }: CustomerHistoryTableProps) {
  if (history.length === 0) {
    return <p className="text-muted-foreground text-center py-4">Nenhum histórico de compras ou pagamentos encontrado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Detalhes</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((item) => {
          const isCancelled = item.type === 'compra' && item.status === 'Cancelada';
          return (
            <TableRow key={`${item.type}-${item.id}`} className={isCancelled ? 'text-muted-foreground' : ''}>
              <TableCell>
                {format(new Date(item.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>
                  {isCancelled ? (
                     <Badge variant="outline" className="gap-1 text-muted-foreground"><Ban className="h-3 w-3" /> Cancelada</Badge>
                  ) : item.type === 'compra' ? (
                       <Badge variant="destructive" className="gap-1"><ArrowDown className="h-3 w-3" /> Compra</Badge>
                  ) : (
                       <Badge variant="secondary" className="gap-1 bg-green-200 text-green-900 hover:bg-green-200/80"><ArrowUp className="h-3 w-3" /> Pagamento</Badge>
                  )}
              </TableCell>
              <TableCell>{item.details}</TableCell>
              <TableCell className={`text-right font-semibold ${isCancelled ? 'line-through' : item.type === 'compra' ? 'text-destructive' : 'text-green-600'}`}>
                {item.type === 'compra' ? '-' : '+'} R$ {item.amount.toFixed(2).replace('.', ',')}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  );
}
