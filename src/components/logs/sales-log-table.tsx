
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Sale } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface SalesLogTableProps {
  logs: Sale[];
}

export function SalesLogTable({ logs }: SalesLogTableProps) {
    if (logs.length === 0) {
        return <p className="text-center text-muted-foreground py-8">Nenhuma venda registrada.</p>;
    }

    return (
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Data e Hora</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Detalhes Cancelamento</TableHead>
            <TableHead className="text-right">Total</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {logs.map((log) => (
            <TableRow key={log.id}>
                <TableCell>{format(new Date(log.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                <TableCell>
                    {log.status === 'Cancelada' ? (
                        <Badge variant="destructive">Cancelada</Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Concluída</Badge>
                    )}
                </TableCell>
                <TableCell>{log.customerName}</TableCell>
                 <TableCell>
                    {log.status === 'Cancelada' && log.cancelledBy && (
                        <div className="text-xs">
                            <p>{log.cancellationReason}</p>
                            <p className="text-muted-foreground">por {log.cancelledBy.name} em {format(new Date(log.cancellationDate!), 'dd/MM/yy HH:mm')}</p>
                        </div>
                    )}
                </TableCell>
                <TableCell className={`text-right font-medium ${log.status === 'Cancelada' ? 'line-through' : ''}`}>
                    R$ {log.total.toFixed(2).replace('.', ',')}
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    );
}
