
'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, User, Phone, Mail, CircleDollarSign, ArrowLeft, History, FileText, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getPaymentHistoryAction } from '@/lib/db-actions';
import type { CashTransaction, Sale } from '@/lib/types';
import { CustomerHistoryTable, type HistoryItem } from '@/components/customers/customer-history-table';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  
  const { customers, sales, loading } = useAppContext();
  const [isClient, setIsClient] = React.useState(false);

  const [paymentHistory, setPaymentHistory] = React.useState<CashTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(true);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!customerId) return;
    setLoadingHistory(true);
    getPaymentHistoryAction(customerId)
      .then((payments) => {
        setPaymentHistory(payments);
      })
      .catch((error) => {
        console.error("Error fetching payment history:", error);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [customerId]);


  const customer = React.useMemo(() => 
    customers.find(c => c.id === customerId),
    [customers, customerId]
  );

  const customerSales = React.useMemo(() => 
    sales.filter(s => s.customerId === customerId),
    [sales, customerId]
  );
  
  const combinedHistory = React.useMemo((): HistoryItem[] => {
    const purchases: HistoryItem[] = customerSales.map((sale: Sale) => ({
        id: sale.id,
        date: sale.date,
        type: 'compra',
        details: `${sale.items.length} item(ns) - Venda #${sale.id.substring(0, 5)}`,
        amount: sale.total,
        status: sale.status,
    }));

    const payments: HistoryItem[] = paymentHistory.map(payment => ({
        id: payment.id,
        date: payment.date,
        type: 'pagamento',
        details: payment.description || 'Pagamento recebido',
        amount: payment.amount,
    }));

    return [...purchases, ...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customerSales, paymentHistory]);
  
  const getCreditStatus = (balance: number, creditLimit: number) => {
    if (creditLimit === 0) {
      return { text: 'Sem Crédito', variant: 'outline' as const, className: '' };
    }
    if (balance > creditLimit) {
      return { text: 'Limite Excedido', variant: 'destructive' as const, className: '' };
    }
    if (balance > 0 && balance >= creditLimit * 0.8) {
      return { text: 'Atenção', variant: 'secondary' as const, className: 'bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80' };
    }
    return { text: 'OK', variant: 'secondary' as const, className: 'bg-green-200 text-green-900 hover:bg-green-200/80' };
  };

  const totalSpent = customerSales
    .filter(sale => sale.status === 'Concluída')
    .reduce((acc, sale) => acc + sale.total, 0);


  if (!isClient || loading.customers || loading.sales || loadingHistory) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader title="Cliente não encontrado" description="O cliente que você está procurando não existe ou foi removido." >
                 <Button asChild variant="outline">
                    <Link href="/dashboard/customers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Clientes
                    </Link>
                </Button>
            </PageHeader>
            <Card className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm bg-card h-[450px]">
                <div className="flex flex-col items-center gap-2 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                    <h3 className="text-2xl font-bold tracking-tight">
                        Erro 404
                    </h3>
                    <p className="text-sm text-muted-foreground">
                       Não foi possível encontrar dados para o cliente com este ID.
                    </p>
                </div>
            </Card>
        </div>
    )
  }
  
  const creditStatus = getCreditStatus(customer.balance, customer.creditLimit);

  return (
    <div className="flex flex-col gap-6">
        <PageHeader title={customer.name} description={`Detalhes e histórico de ${customer.name}`}>
            <Button asChild variant="outline">
                <Link href="/dashboard/customers">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Clientes
                </Link>
            </Button>
        </PageHeader>

        <div className="grid gap-6 md:grid-cols-3">
             <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><User /> Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{customer.phone}</span>
                   </div>
                   {customer.email && (
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{customer.email}</span>
                        </div>
                   )}
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><CircleDollarSign /> Situação Financeira</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status do Crédito</span>
                        <Badge variant={creditStatus.variant} className={creditStatus.className}>
                            {creditStatus.text}
                        </Badge>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Saldo Devedor</span>
                        <span className="text-sm font-bold text-destructive">R$ {customer.balance.toFixed(2).replace('.', ',')}</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Limite de Crédito</span>
                        <span className="text-sm font-semibold">R$ {customer.creditLimit.toFixed(2).replace('.', ',')}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-card">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">Resumo</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-3">
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total de Compras</span>
                        <span className="text-sm font-semibold">{customerSales.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Gasto Total</span>
                        <span className="text-sm font-bold">R$ {totalSpent.toFixed(2).replace('.', ',')}</span>
                    </div>
                 </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Tag /> Tags</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {(customer.tags && customer.tags.length > 0) ? (
                        customer.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)
                    ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma tag definida.</p>
                    )}
                </CardContent>
            </Card>

             <Card className="rounded-2xl border-none shadow-sm bg-card md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><FileText /> Anotações</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{customer.notes || 'Nenhuma anotação registrada.'}</p>
                </CardContent>
            </Card>
        </div>


        <Card className="rounded-2xl border-none shadow-sm bg-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History /> Histórico de Transações</CardTitle>
                <CardDescription>Visualize todas as compras e pagamentos de {customer.name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <CustomerHistoryTable history={combinedHistory} />
            </CardContent>
        </Card>
    </div>
  );
}
