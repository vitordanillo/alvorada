
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProductChangeLog, Product } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProductChangeLogTableProps {
  logs: ProductChangeLog[];
}

const fieldLabels: Record<string, string> = {
  name: 'Nome',
  price: 'Preço',
  category: 'Categoria',
  supplier: 'Fornecedor',
  minStock: 'Estoque Mínimo',
  unit: 'Unidade',
  barcode: 'Cód. de Barras',
};

const formatValue = (field: string, value: any) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (field === 'price') {
        return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
    }
    return String(value);
}

export function ProductChangeLogTable({ logs }: ProductChangeLogTableProps) {
  if (logs.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhuma alteração de produto registrada para os filtros selecionados.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data e Hora</TableHead>
          <TableHead>Produto</TableHead>
          <TableHead>Usuário</TableHead>
          <TableHead>Alterações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{format(new Date(log.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
            <TableCell className="font-medium">{log.productName}</TableCell>
            <TableCell>{log.changedBy.name}</TableCell>
            <TableCell>
                <ul className="space-y-1">
                    {log.changes.map((change, index) => (
                        <li key={index} className="text-xs">
                           <strong>{fieldLabels[change.field] || change.field}:</strong> 
                           <span className="ml-1 line-through text-muted-foreground">{formatValue(change.field, change.oldValue)}</span>
                           <span className="font-semibold mx-1">&rarr;</span>
                           <span className="font-semibold text-primary">{formatValue(change.field, change.newValue)}</span>
                        </li>
                    ))}
                </ul>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
