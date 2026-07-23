
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookMarked, LineChart, Package, Wallet } from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Central de Relatórios"
        description="Analise o desempenho do seu negócio com relatórios detalhados."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/reports/sales" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LineChart className="text-primary"/> Relatório de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Visualize faturamento, ticket médio e desempenho de vendas por período.</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/reports/products" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="text-primary"/> Relatório de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Identifique seus produtos mais vendidos, mais rentáveis e com baixo estoque.</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/reports/cash-flow" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wallet className="text-primary"/> Relatório de Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Consolide entradas e saídas para uma visão clara da saúde financeira do seu negócio.</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/accounts-payable" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookMarked className="text-primary"/> Contas a Pagar</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Gerencie suas despesas, boletos e contas a pagar para manter a saúde financeira.</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
