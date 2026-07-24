
'use client';

import * as React from 'react';
import { MoreHorizontal, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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
import type { AccountsPayable } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface AccountsPayableTableProps {
  payables: AccountsPayable[];
  onEdit: (payable: AccountsPayable) => void;
  onDelete: (payable: AccountsPayable) => void;
  onPay: (payable: AccountsPayable) => void;
}

const PayableList = ({ payables, onEdit, onDelete, onPay }: AccountsPayableTableProps) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Vencimento</TableHead>
        <TableHead>Descrição</TableHead>
        <TableHead>Categoria</TableHead>
        <TableHead>Fornecedor</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Valor</TableHead>
        <TableHead>
          <span className="sr-only">Ações</span>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {payables.length === 0 ? (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">Nenhuma conta encontrada.</TableCell>
        </TableRow>
      ) : payables.map((payable) => {
        const isOverdue = isPast(new Date(payable.dueDate)) && payable.status === 'Pendente';
        return (
          <TableRow key={payable.id}>
            <TableCell className={isOverdue ? 'text-destructive font-medium' : ''}>
              {format(new Date(payable.dueDate), "dd/MM/yyyy", { locale: ptBR })}
            </TableCell>
            <TableCell>{payable.description}</TableCell>
            <TableCell>
              {payable.category ? (
                <Badge variant="secondary">{payable.category}</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </TableCell>
            <TableCell>{payable.supplierName || 'N/A'}</TableCell>
            <TableCell>
              <Badge variant={payable.status === 'Pago' ? 'default' : isOverdue ? 'destructive' : 'outline'}>
                {isOverdue ? 'Vencido' : payable.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-medium">R$ {payable.amount.toFixed(2).replace('.', ',')}</TableCell>
            <TableCell className="text-right">
              {payable.status !== 'Pago' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onPay(payable)}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Pago
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(payable)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(payable)} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);

export function AccountsPayableTable({ payables, onEdit, onDelete, onPay }: AccountsPayableTableProps) {
  const pending = (payables || []).filter(p => p.status === 'Pendente' && !isPast(new Date(p.dueDate)));
  const overdue = (payables || []).filter(p => p.status === 'Pendente' && isPast(new Date(p.dueDate)));
  const paid = (payables || []).filter(p => p.status === 'Pago');

  return (
    <Card className="rounded-2xl border-none shadow-sm bg-card">
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pendentes ({pending.length})</TabsTrigger>
            <TabsTrigger value="overdue" className="data-[state=active]:bg-destructive/80 data-[state=active]:text-destructive-foreground">Vencidas ({overdue.length})</TabsTrigger>
            <TabsTrigger value="paid">Pagas ({paid.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4">
            <PayableList payables={pending} onEdit={onEdit} onDelete={onDelete} onPay={onPay} />
          </TabsContent>
          <TabsContent value="overdue" className="mt-4">
            <PayableList payables={overdue} onEdit={onEdit} onDelete={onDelete} onPay={onPay} />
          </TabsContent>
          <TabsContent value="paid" className="mt-4">
            <PayableList payables={paid} onEdit={onEdit} onDelete={onDelete} onPay={onPay} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
