
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { StockEntryLog } from '@/lib/types';
import Link from 'next/link';
import { Button } from '../ui/button';

interface StockEntryLogTableProps {
  logs: StockEntryLog[];
}

export function StockEntryLogTable({ logs }: StockEntryLogTableProps) {
  if (logs.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhuma entrada de estoque registrada para os filtros selecionados.</p>;
  }

  return (
    <Accordion type="multiple" className="w-full">
      {logs.map((log) => (
        <AccordionItem key={log.id} value={log.id}>
          <AccordionTrigger className="hover:no-underline p-4 rounded-lg hover:bg-muted/50">
            <div className="flex justify-between items-center w-full text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-left">
                    <span className="font-semibold">{format(new Date(log.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    <span className="text-muted-foreground">{log.supplierName}</span>
                </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-right">
                    {log.purchaseOrderId && (
                        <Button asChild variant="link" size="sm" className="h-auto p-0">
                            <Link href={`/dashboard/purchase-orders/${log.purchaseOrderId}`}>
                                (Pedido #{log.purchaseOrderId.substring(0,6)})
                            </Link>
                        </Button>
                    )}
                    <span className="text-muted-foreground">{log.totalItems} itens</span>
                    <span className="font-bold font-headline text-primary">R$ {log.totalCost.toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-muted/20 border-t">
              <h4 className="font-semibold mb-2">Itens Recebidos:</h4>
               <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Custo Unit.</TableHead>
                        <TableHead className="text-right">Custo Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {log.items.map(item => (
                        <TableRow key={item.productId}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">R$ {item.cost.toFixed(2).replace('.', ',')}</TableCell>
                            <TableCell className="text-right font-medium">R$ {(item.cost * item.quantity).toFixed(2).replace('.', ',')}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
               </Table>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
