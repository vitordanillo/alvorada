
'use client';

import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useAppContext } from '@/context/app-context';
import { StatCard } from '@/components/dashboard/stat-card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, Coins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { CashFlowData } from '@/lib/types';


export function CashFlowReportClient() {
    const { cashSessions, loading } = useAppContext();
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - 30);
        return { from, to };
    });

    const cashFlowData = React.useMemo((): CashFlowData[] => {
        if (!dateRange?.from) return [];
        
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? new Date(dateRange.to.setHours(23, 59, 59, 999)) : from;

        const dailyData: { [key: string]: { entradas: number; saidas: number } } = {};

        // Filter for closed sessions within the date range and process them
        cashSessions
            .filter(session => {
                if (session.status !== 'Fechado') return false;
                const sessionDate = parseISO(session.openingTime);
                return sessionDate >= from && sessionDate <= to;
            })
            .forEach(session => {
                const day = format(parseISO(session.openingTime), 'yyyy-MM-dd');

                if (!dailyData[day]) {
                    dailyData[day] = { entradas: 0, saidas: 0 };
                }

                // Defensively access properties
                dailyData[day].entradas += (session.salesByPaymentMethod?.Dinheiro || 0) + (session.totalCreditPayments || 0);
                dailyData[day].saidas += (session.totalExpenses || 0) + (session.totalWithdrawals || 0);
            });

        // Sort by date to ensure chronological order
        const sortedDays = Object.keys(dailyData).sort();
        
        // Format for the chart
        return sortedDays.map(day => ({
            date: format(parseISO(day), 'dd/MM', { locale: ptBR }),
            entradas: dailyData[day].entradas,
            saidas: dailyData[day].saidas,
        }));
    }, [cashSessions, dateRange]);
    
    const totalEntradas = cashFlowData.reduce((sum, day) => sum + day.entradas, 0);
    const totalSaidas = cashFlowData.reduce((sum, day) => sum + day.saidas, 0);
    const saldo = totalEntradas - totalSaidas;

    const statCards = [
        { title: 'Total de Entradas', value: `R$ ${totalEntradas.toFixed(2).replace('.', ',')}`, icon: ArrowUp },
        { title: 'Total de Saídas', value: `R$ ${totalSaidas.toFixed(2).replace('.', ',')}`, icon: ArrowDown },
        { title: 'Saldo do Período', value: `R$ ${saldo.toFixed(2).replace('.', ',')}`, icon: Coins },
    ];
    
     if (loading.cashSessions) {
        return <Skeleton className="w-full h-96" />
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold">Filtros do Relatório</h2>
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
                {statCards.map((card) => (
                    <StatCard key={card.title} {...card} />
                ))}
            </div>

            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader>
                    <CardTitle className="font-headline">Evolução do Fluxo de Caixa</CardTitle>
                    <CardDescription>Entradas vs. Saídas de dinheiro físico por dia.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={cashFlowData}>
                             <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                                cursor={{ fill: 'hsl(var(--muted))' }}
                            />
                            <Legend />
                            <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader>
                    <CardTitle className="font-headline">Detalhamento por Dia</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Entradas</TableHead>
                                <TableHead className="text-right">Saídas</TableHead>
                                <TableHead className="text-right">Saldo do Dia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cashFlowData.length > 0 ? (
                                cashFlowData.map((day) => (
                                    <TableRow key={day.date}>
                                        <TableCell>{day.date}</TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">R$ {day.entradas.toFixed(2).replace('.', ',')}</TableCell>
                                        <TableCell className="text-right text-red-600 font-medium">R$ {day.saidas.toFixed(2).replace('.', ',')}</TableCell>
                                        <TableCell className="text-right font-bold">R$ {(day.entradas - day.saidas).toFixed(2).replace('.', ',')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        Nenhum dado de fluxo de caixa encontrado para o período selecionado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
