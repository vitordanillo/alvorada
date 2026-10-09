
import {BusinessReport} from '@/components/reports/business-report';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, PackagePlus, SlidersHorizontal, ClipboardPlus } from "lucide-react";
import Link from "next/link";

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestão de Estoque"
        description="Acesse as ferramentas para controle de reposição e entrada de mercadorias."
      />
      <BusinessReport view="inventory"/>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/inventory/restock" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lightbulb className="text-primary"/> Sugestão com IA</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Use a IA para analisar vendas e obter sugestões inteligentes de reposição de estoque.</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/inventory/entry" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PackagePlus className="text-primary"/> Entrada de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Registre a entrada de novas mercadorias recebidas dos seus fornecedores para atualizar o inventário.</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/inventory/adjustment" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="text-primary"/> Ajuste Manual</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Corrija manualmente o estoque para perdas, avarias ou acertos de contagem.</CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/purchase-orders" className="focus:outline-none focus:ring-2 focus:ring-primary rounded-2xl">
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardPlus className="text-primary"/> Pedidos de Compra</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Crie e gerencie seus pedidos de compra para fornecedores, agilizando o processo de reposição.</CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
