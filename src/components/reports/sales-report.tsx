

'use client';

import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { useAppContext } from '@/context/app-context';
import { StatCard } from '@/components/dashboard/stat-card';
import { SalesChart } from '@/components/charts/sales-chart';
import { SalesTable } from '@/components/sales/sales-table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleDollarSign, Activity, TrendingUp, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function SalesReportClient() {
    const { sales, loading, cancelSale, user } = useAppContext();
    const { toast } = useToast();
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });

    const filteredSales = React.useMemo(() => {
        if (!dateRange?.from) return [];
        
        const from = new Date(dateRange.from.setHours(0, 0, 0, 0));
        const to = dateRange.to ? new Date(dateRange.to.setHours(23, 59, 59, 999)) : from;

        return sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= from && saleDate <= to;
        });
    }, [sales, dateRange]);

    const concludedSales = filteredSales.filter(s => s.status === 'Concluída');

    const totalRevenue = concludedSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = concludedSales.reduce((sum, sale) => sum + (sale.totalProfit || 0), 0);
    const totalSalesCount = concludedSales.length;
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;


    const getSalesChartData = (salesData: Sale[]) => {
        const salesByDay: { [key: string]: number } = {};

        salesData.forEach(sale => {
            const day = new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit'});
            if (salesByDay[day]) {
                salesByDay[day] += sale.total;
            } else {
                salesByDay[day] = sale.total;
            }
        });

        return Object.keys(salesByDay).map(day => ({ name: day, total: salesByDay[day] })).sort((a,b) => new Date(a.name.split('/').reverse().join('-')).getTime() - new Date(b.name.split('/').reverse().join('-')).getTime());
    };

    const salesChartData = getSalesChartData(concludedSales);

    const statCards = [
        { title: 'Faturamento no Período', value: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, icon: CircleDollarSign },
        { title: 'Lucro no Período', value: `R$ ${totalProfit.toFixed(2).replace('.', ',')}`, icon: TrendingUp },
        { title: 'Vendas no Período', value: `${totalSalesCount}`, icon: Activity },
        { title: 'Margem Média', value: `${averageMargin.toFixed(2).replace('.', ',')}%`, icon: Percent },
    ];

    if (loading.sales) {
        return <Skeleton className="w-full h-96" />
    }
    
    const handleCancel = async (sale: Sale) => {
        // This report is mostly for managers/admins, so we can assume they have rights
        // or a more robust check would be needed. For now, this is a simplified flow.
        toast({
            title: 'Funcionalidade desativada',
            description: 'O cancelamento de vendas deve ser feito a partir da página de Histórico de Vendas.',
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold">Filtros do Relatório</h2>
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => (
                    <StatCard key={card.title} {...card} change="" changeType="increase" />
                ))}
            </div>

            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader>
                    <CardTitle className="font-headline">Evolução das Vendas no Período</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <SalesChart data={salesChartData} />
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader>
                    <CardTitle className="font-headline">Detalhamento das Vendas</CardTitle>
                </CardHeader>
                <CardContent>
                    <SalesTable sales={filteredSales} onCancel={handleCancel} />
                </CardContent>
            </Card>
        </div>
    );
}
