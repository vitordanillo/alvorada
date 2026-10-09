
'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
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
import type { Customer } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatCpfCnpj } from '@/lib/cnpj-lookup';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onRegisterPayment: (customer: Customer) => void;
  onSendWhatsApp?: (customer: Customer) => void;
}

export function CustomerTable({ customers, onEdit, onDelete, onRegisterPayment, onSendWhatsApp }: CustomerTableProps) {
  const getCreditStatus = (balance: number, creditLimit: number) => {
    if (creditLimit === 0) {
      return { text: 'Sem Crédito', variant: 'outline' as const, className: '' };
    }
    if (balance > creditLimit) {
      return { text: 'Excedido', variant: 'destructive' as const, className: '' };
    }
    if (balance > 0 && balance >= creditLimit * 0.8) {
      return { text: 'Atenção', variant: 'secondary' as const, className: 'bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80' };
    }
    return { text: 'OK', variant: 'secondary' as const, className: 'bg-green-200 text-green-900 hover:bg-green-200/80' };
  };

  return (
    <Card className="rounded-2xl border-none shadow-sm bg-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">CPF/CNPJ</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead>Pontos de Fidelidade</TableHead>
              <TableHead>Situação do Crédito</TableHead>
              <TableHead className="text-right">Crédito (Usado / Limite)</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              const creditStatus = getCreditStatus(customer.balance, customer.creditLimit);
              return (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://placehold.co/40x40.png?text=${customer.name.charAt(0)}`} alt="Avatar" data-ai-hint="person avatar" />
                      <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{customer.name}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-sm">
                  {customer.cpfCnpj ? formatCpfCnpj(customer.cpfCnpj) : '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell">{customer.phone}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 font-semibold text-sm text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                    {customer.loyaltyPoints || 0} pts
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={creditStatus.variant} className={creditStatus.className}>
                    {creditStatus.text}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {`R$ ${customer.balance.toFixed(2).replace('.', ',')} / R$ ${customer.creditLimit.toFixed(2).replace('.', ',')}`}
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
                      <DropdownMenuItem onClick={() => onRegisterPayment(customer)} disabled={customer.balance <= 0}>
                        Registrar Pagamento
                      </DropdownMenuItem>
                      {customer.balance > 0 && onSendWhatsApp && (
                        <DropdownMenuItem onClick={() => onSendWhatsApp(customer)}>
                          Cobrar via WhatsApp
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/customers/detail?id=${customer.id}`}>Ver Histórico</Link>
                      </DropdownMenuItem>
                       <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(customer)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">Excluir</DropdownMenuItem>
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
