
'use client';

import * as React from 'react';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, Box, UserX, Scale, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '../ui/skeleton';

export function AlertsCard() {
    const { products, customers, cashSessions, accountsPayable, loading } = useAppContext();
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const cashDifferenceAlerts = (cashSessions || []).filter(
        (s) => s.status === 'Fechado' && s.closingBalance !== null && Math.abs(s.closingBalance - s.calculatedCashInDrawer) > 0.01
    );

    const creditLimitAlerts = (customers || []).filter(
        (c) => c.creditLimit > 0 && c.balance > c.creditLimit
    );

    const lowStockAlerts = (products || []).filter(
        (p) => p.status === 'Ativo' && p.stock > 0 && p.stock < p.minStock
    );

    const outOfStockAlerts = (products || []).filter(
        (p) => p.status === 'Ativo' && p.stock === 0
    );

    const now = new Date();
    const overduePayables = (accountsPayable || []).filter(
        p => p.status === 'Pendente' && new Date(p.dueDate) < now
    );

    const totalAlerts = cashDifferenceAlerts.length + creditLimitAlerts.length + lowStockAlerts.length + outOfStockAlerts.length + overduePayables.length;

    if (!isClient || loading.products || loading.customers || loading.cashSessions || loading.accountsPayable) {
        return (
             <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (totalAlerts === 0) {
        return null; // Don't show the card if there are no alerts
    }

    return (
        <Card className="rounded-2xl border-yellow-500/50 bg-yellow-500/5 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
                    <AlertTriangle />
                    Alertas e Notificações ({totalAlerts})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full">
                    {cashDifferenceAlerts.length > 0 && (
                        <AccordionItem value="cash">
                            <AccordionTrigger className="text-base">
                                <div className="flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-destructive" />
                                    Diferenças de Caixa ({cashDifferenceAlerts.length})
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-2 pl-4">
                                    {cashDifferenceAlerts.map(session => (
                                        <li key={session.id} className="text-sm">
                                            <Link href="/dashboard/cash-register" className="hover:underline">
                                                Caixa de {format(new Date(session.openingTime), 'dd/MM/yyyy', {locale: ptBR})} fechou com diferença.
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                    {creditLimitAlerts.length > 0 && (
                        <AccordionItem value="credit">
                            <AccordionTrigger className="text-base">
                                 <div className="flex items-center gap-2">
                                    <UserX className="h-5 w-5 text-destructive" />
                                    Clientes com Crédito Excedido ({creditLimitAlerts.length})
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                               <ul className="space-y-2 pl-4">
                                    {creditLimitAlerts.map(customer => (
                                        <li key={customer.id} className="text-sm">
                                            <Link href={`/dashboard/customers/${customer.id}`} className="hover:underline">
                                                {customer.name} ultrapassou o limite de crédito.
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                     {(lowStockAlerts.length > 0 || outOfStockAlerts.length > 0) && (
                        <AccordionItem value="stock">
                            <AccordionTrigger className="text-base">
                                <div className="flex items-center gap-2">
                                    <Box className="h-5 w-5 text-yellow-600" />
                                    Alertas de Estoque ({lowStockAlerts.length + outOfStockAlerts.length})
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-3 pl-4">
                                    {outOfStockAlerts.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-destructive">Fora de Estoque ({outOfStockAlerts.length}):</h4>
                                            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                                                {outOfStockAlerts.slice(0, 5).map(p => <li key={p.id}>{p.name}</li>)}
                                                {outOfStockAlerts.length > 5 && <li>e mais {outOfStockAlerts.length - 5}...</li>}
                                            </ul>
                                        </div>
                                    )}
                                    {lowStockAlerts.length > 0 && (
                                         <div>
                                            <h4 className="font-semibold text-yellow-700">Estoque Baixo ({lowStockAlerts.length}):</h4>
                                            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                                                {lowStockAlerts.slice(0, 5).map(p => <li key={p.id}>{p.name}</li>)}
                                                {lowStockAlerts.length > 5 && <li>e mais {lowStockAlerts.length - 5}...</li>}
                                            </ul>
                                        </div>
                                    )}
                                    <Button asChild variant="link" className="p-0 h-auto">
                                        <Link href="/dashboard/inventory/restock">Ver sugestões de reposição com IA &rarr;</Link>
                                    </Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                     )}
                     {overduePayables.length > 0 && (
                        <AccordionItem value="payables">
                            <AccordionTrigger className="text-base">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-red-600" />
                                    Contas a Pagar Vencidas ({overduePayables.length})
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-2 pl-4">
                                    {overduePayables.map(payable => (
                                        <li key={payable.id} className="text-sm">
                                            <Link href="/dashboard/accounts-payable" className="hover:underline">
                                                {payable.description} - R$ {payable.amount.toFixed(2).replace('.',',')} venceu em {format(new Date(payable.dueDate), 'dd/MM/yyyy', {locale: ptBR})}.
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </CardContent>
        </Card>
    )
}
