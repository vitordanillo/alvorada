
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { StockAdjustmentLog } from '@/lib/types';
import { ArrowRight } from 'lucide-react';

interface StockAdjustmentLogTableProps {
  logs: StockAdjustmentLog[];
}

export function StockAdjustmentLogTable({ logs }: StockAdjustmentLogTableProps) {
  if (logs.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum ajuste de estoque registrado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data e Hora</TableHead>
          <TableHead>Produto</TableHead>
          <TableHead>Ajuste</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Usuário</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{format(new Date(log.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
            <TableCell className="font-medium">{log.productName}</TableCell>
            <TableCell>
                <div className="flex items-center gap-2 font-mono text-sm">
                    <span>{log.oldQuantity}</span>
                    <ArrowRight className="h-4 w-4" />
                    <span className="font-bold">{log.newQuantity}</span>
                </div>
            </TableCell>
            <TableCell>{log.reason}</TableCell>
            <TableCell>{log.adjustedBy.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
