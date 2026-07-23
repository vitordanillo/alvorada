
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleDollarSign, Package, Users, Activity } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { SalesChart } from '@/components/charts/sales-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { PageHeader } from '@/components/page-header';
import { useAppContext } from '@/context/app-context';
import type { SalesData } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertsCard } from '@/components/dashboard/alerts-card';
import type { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';

export default function DashboardPage() {
  const { sales, products, customers, loading } = useAppContext();
  const [isClient, setIsClient] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  const filteredSales = React.useMemo(() => {
    if (!dateRange?.from || loading.sales) return [];
    
    const from = new Date(dateRange.from.setHours(0, 0, 0, 0));
    const to = dateRange.to ? new Date(dateRange.to.setHours(23, 59, 59, 999)) : from;

    return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= from && saleDate <= to;
    });
  }, [sales, dateRange, loading.sales]);

  const concludedSales = filteredSales.filter(s => s.status === 'Concluída');
  const totalRevenue = concludedSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSalesCount = concludedSales.length;
  const activeProductsCount = products.filter(p => p.status === 'Ativo').length;
  const totalCustomersCount = customers.length;

  const statCards = [
    { title: 'Faturamento no Período', value: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, change: '', changeType: 'increase', icon: CircleDollarSign },
    { title: 'Vendas no Período', value: `${totalSalesCount}`, change: '', changeType: 'increase', icon: Activity },
    { title: 'Produtos Ativos', value: `${activeProductsCount}`, change: '', changeType: 'increase', icon: Package },
    { title: 'Clientes Cadastrados', value: `${totalCustomersCount}`, change: '', changeType: 'increase', icon: Users },
  ];

  const getSalesChartData = (): SalesData[] => {
    if (loading.sales) return [];

    const salesByDay: { [key: string]: number } = {};
    const dayMapping: { [key: number]: string } = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sab' };

    // Initialize all days of the week to 0
    Object.values(dayMapping).forEach(day => {
        salesByDay[day] = 0;
    });

    concludedSales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const dayOfWeek = dayMapping[saleDate.getDay()];
        if (dayOfWeek) {
            salesByDay[dayOfWeek] += sale.total;
        }
    });

    return Object.keys(dayMapping).map(key => {
        const dayName = dayMapping[Number(key) as keyof typeof dayMapping];
        return { name: dayName.substring(0, 3), total: salesByDay[dayName] || 0 };
    });
  };

  const salesChartData = getSalesChartData();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="Bem-vindo ao painel do Alvorada Smart Market.">
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
      
      <AlertsCard />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 rounded-2xl border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="font-headline">Visão Geral de Vendas</CardTitle>
             <CardDescription>
                Exibindo vendas para o período selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {(!isClient || loading.sales) ? (
              <div className="w-full h-[350px] flex items-center justify-center p-6">
                <Skeleton className="w-full h-full" />
              </div>
            ) : (
               <SalesChart data={salesChartData} />
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3 rounded-2xl border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="font-headline">Vendas Recentes</CardTitle>
            <CardDescription>
                {(!isClient || loading.sales) ? 'Carregando...' : `Mostrando as últimas vendas no período.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
             {(!isClient || loading.sales) ? (
                <div className="space-y-8">
                    {[...Array(5)].map((_, i) => (
                        <div className="flex items-center" key={i}>
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="ml-4 space-y-2">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-4 w-[70px]" />
                            </div>
                            <Skeleton className="ml-auto h-5 w-[60px]" />
                        </div>
                    ))}
                </div>
             ) : (
                <RecentSales sales={concludedSales} />
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
