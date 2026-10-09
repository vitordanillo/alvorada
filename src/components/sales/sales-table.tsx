

'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Receipt, XCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import type { Sale } from '@/lib/types';
import { ReceiptDialog } from './receipt-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '../ui/badge';

interface SalesTableProps {
  sales: Sale[];
  onCancel: (sale: Sale) => void;
}

export function SalesTable({ sales, onCancel }: SalesTableProps) {
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
  const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);

  const handleViewReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setIsReceiptOpen(true);
  };

  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getPaymentMethodsString = (payments: Sale['paymentMethods']) => {
    if (!payments || payments.length === 0) return 'N/A';
    if (payments.length === 1) return payments[0].method;
    return 'Múltiplo';
  };

  return (
    <>
      <Card className="rounded-2xl border-none shadow-sm bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSales.map((sale) => (
                <TableRow key={sale.id} className={sale.status === 'Cancelada' ? 'text-muted-foreground' : ''}>
                  <TableCell>
                    {format(new Date(sale.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{sale.customerName}</TableCell>
                  <TableCell>
                    {sale.status === 'Cancelada' ? (
                      <Badge variant="destructive">Cancelada</Badge>
                    ) : sale.status === 'Pendente' ? <Badge variant="outline">Pendente</Badge> : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Concluída</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{getPaymentMethodsString(sale.paymentMethods)}</TableCell>
                  <TableCell className={`text-right font-medium ${sale.status === 'Cancelada' ? 'line-through' : 'text-green-600'}`}>
                    R$ {(sale.totalProfit ?? 0).toFixed(2).replace('.', ',')}
                  </TableCell>
                  <TableCell className={`text-right font-headline ${sale.status === 'Cancelada' ? 'line-through' : ''}`}>
                    R$ {sale.total.toFixed(2).replace('.', ',')}
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewReceipt(sale)}>
                          <Receipt className="mr-2 h-4 w-4" /> Ver Recibo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onCancel(sale)} 
                          disabled={sale.status !== 'Concluída'}
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Cancelar Venda
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <ReceiptDialog 
        sale={selectedSale}
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
      />
    </>
  );
}
