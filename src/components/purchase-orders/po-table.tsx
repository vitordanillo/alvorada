
'use client';

import * as React from 'react';
import { MoreHorizontal, Edit, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import type { PurchaseOrder } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PurchaseOrderTableProps {
  orders: PurchaseOrder[];
  onReceive: (order: PurchaseOrder) => void;
}

export function PurchaseOrderTable({ orders, onReceive }: PurchaseOrderTableProps) {
    const getStatusVariant = (status: PurchaseOrder['status']) => {
        switch (status) {
            case 'Pendente':
                return 'secondary';
            case 'Recebido':
                return 'default';
            case 'Recebido Parcialmente':
                return 'outline';
            case 'Cancelado':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

  return (
    <Card className="rounded-2xl border-none shadow-sm bg-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#ID</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Custo Total</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum pedido de compra encontrado.
                    </TableCell>
                </TableRow>
            ) : orders.map((order) => {
              return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id.substring(0,8)}</TableCell>
                <TableCell>{order.supplierName}</TableCell>
                <TableCell>{format(new Date(order.dateCreated), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                    </Badge>
                </TableCell>
                <TableCell className="text-right font-medium font-headline">
                    R$ {order.totalCost.toFixed(2).replace('.', ',')}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onReceive(order)} disabled={order.status === 'Recebido' || order.status === 'Cancelado'}>
                        <PackageCheck className="mr-2 h-4 w-4"/>
                        Receber Mercadoria
                      </DropdownMenuItem>
                       <DropdownMenuSeparator />
                      <DropdownMenuItem asChild disabled={order.status !== 'Pendente'}>
                        <Link href={`/dashboard/purchase-orders/${order.id}`}>
                            <Edit className="mr-2 h-4 w-4"/> Editar Pedido
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
