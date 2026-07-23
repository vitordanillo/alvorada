

'use client';

import * as React from 'react';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ProductsReportClient() {
    const { products, sales, loading } = useAppContext();

    const productPerformance = React.useMemo(() => {
        const performanceMap = new Map<string, { unitsSold: number; revenue: number; profit: number }>();
        const concludedSales = sales.filter(s => s.status === 'Concluída');

        products.forEach(product => {
            performanceMap.set(product.id, { unitsSold: 0, revenue: 0, profit: 0 });
        });

        concludedSales.forEach(sale => {
            if (sale.items && Array.isArray(sale.items)) {
                sale.items.forEach(item => {
                    if (item.productId && performanceMap.has(item.productId)) {
                        const currentPerf = performanceMap.get(item.productId)!;
                        const itemProfit = (item.price - (item.costAtTimeOfSale || 0)) * item.quantity;

                        currentPerf.unitsSold += item.quantity;
                        currentPerf.revenue += item.quantity * item.price;
                        currentPerf.profit += itemProfit;

                        performanceMap.set(item.productId, currentPerf);
                    }
                });
            }
        });

        return products.map(product => ({
            ...product,
            unitsSold: performanceMap.get(product.id)?.unitsSold || 0,
            revenue: performanceMap.get(product.id)?.revenue || 0,
            profit: performanceMap.get(product.id)?.profit || 0,
        }));
    }, [products, sales]);

    const bestSellersByUnits = [...productPerformance].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 10);
    const mostProfitableByProfit = [...productPerformance].sort((a, b) => b.profit - a.profit).slice(0, 10);

    const lowStockProducts = products.filter(p => p.status === 'Ativo' && p.stock > 0 && p.stock < p.minStock);
    const outOfStockProducts = products.filter(p => p.status === 'Ativo' && p.stock === 0);

    if (loading.products || loading.sales) {
        return <Skeleton className="w-full h-96" />
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="rounded-2xl border-none shadow-sm bg-card">
                    <CardHeader>
                        <CardTitle>Produtos com Baixo Estoque</CardTitle>
                        <CardDescription>Produtos que atingiram o nível mínimo de estoque e precisam de reposição.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead className="text-right">Estoque Atual / Mínimo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.name}</TableCell>
                                        <TableCell className="text-right"><span className="font-bold text-yellow-600">{p.stock}</span> / {p.minStock}</TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nenhum produto com baixo estoque.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card className="rounded-2xl border-none shadow-sm bg-card">
                    <CardHeader>
                        <CardTitle>Produtos Fora de Estoque</CardTitle>
                         <CardDescription>Produtos que estão com o estoque zerado e indisponíveis para venda.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead className="text-right">Estoque Mínimo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {outOfStockProducts.length > 0 ? outOfStockProducts.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.name}</TableCell>
                                        <TableCell className="text-right text-destructive font-bold">{p.minStock}</TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nenhum produto fora de estoque.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
             <Card className="rounded-2xl border-none shadow-sm bg-card">
                <CardHeader>
                    <CardTitle>Ranking de Produtos</CardTitle>
                    <CardDescription>Visualize os produtos mais vendidos por unidades ou por faturamento.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="profit">
                        <TabsList className="mb-4">
                            <TabsTrigger value="profit">Mais Lucrativos</TabsTrigger>
                            <TabsTrigger value="units">Mais Vendidos (Unidades)</TabsTrigger>
                        </TabsList>
                        <TabsContent value="profit">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Produto</TableHead>
                                        <TableHead className="text-right">Lucro Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mostProfitableByProfit.map((p, index) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{p.name}</TableCell>
                                            <TableCell className="text-right font-bold font-headline text-green-600">R$ {p.profit.toFixed(2).replace('.',',')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                        <TabsContent value="units">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Produto</TableHead>
                                        <TableHead className="text-right">Unidades Vendidas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bestSellersByUnits.map((p, index) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{p.name}</TableCell>
                                            <TableCell className="text-right font-bold">{p.unitsSold} {p.unit}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </CardContent>
             </Card>
        </div>
    );
}
