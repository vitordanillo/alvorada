
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AccountsPayable } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface AccountsPayableLogTableProps {
  logs: AccountsPayable[];
}

export function AccountsPayableLogTable({ logs }: AccountsPayableLogTableProps) {
    if (logs.length === 0) {
        return <p className="text-center text-muted-foreground py-8">Nenhuma conta a pagar registrada para os filtros selecionados.</p>;
    }

    const getStatusVariant = (status: AccountsPayable['status']) => {
        switch (status) {
            case 'Pendente':
                return 'outline';
            case 'Pago':
                return 'default';
            case 'Vencido':
                return 'destructive';
            default:
                return 'secondary';
        }
    };


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Criação</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Registrado Por</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{format(new Date(log.dateCreated), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
            <TableCell>{log.description}</TableCell>
            <TableCell>{format(new Date(log.dueDate), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
            <TableCell>
                <Badge variant={getStatusVariant(log.status)}>
                    {log.status}
                </Badge>
            </TableCell>
            <TableCell>{log.registeredBy.name}</TableCell>
            <TableCell className="text-right font-medium">
                R$ {log.amount.toFixed(2).replace('.', ',')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
