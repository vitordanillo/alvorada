
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CashTransaction } from '@/lib/types';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface CashTransactionLogTableProps {
  logs: CashTransaction[];
}

export function CashTransactionLogTable({ logs }: CashTransactionLogTableProps) {
    if (logs.length === 0) {
        return <p className="text-center text-muted-foreground py-8">Nenhuma movimentação de caixa registrada.</p>;
    }

    const getTransactionStyle = (type: CashTransaction['type']) => {
        switch (type) {
            case 'Despesa': return { text: 'text-red-600', icon: <ArrowDown className="h-4 w-4" /> };
            case 'Sangria': return { text: 'text-yellow-600', icon: <ArrowUp className="h-4 w-4" /> };
            case 'Recebimento Fiado': return { text: 'text-green-600', icon: <ArrowUp className="h-4 w-4" /> };
            default: return { text: '', icon: null };
        }
    }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data e Hora</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Usuário</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
            const style = getTransactionStyle(log.type);
            return (
              <TableRow key={log.id}>
                <TableCell>{format(new Date(log.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        {style.icon}
                        <span>{log.type}</span>
                    </div>
                </TableCell>
                <TableCell>{log.description}</TableCell>
                <TableCell>{log.registeredBy.name}</TableCell>
                <TableCell className={`text-right font-medium ${style.text}`}>
                    R$ {log.amount.toFixed(2).replace('.', ',')}
                </TableCell>
              </TableRow>
            )
        })}
      </TableBody>
    </Table>
  );
}

