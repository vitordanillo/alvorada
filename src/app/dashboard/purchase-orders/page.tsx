
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { PurchaseOrderClient } from "./po-client";

export default function PurchaseOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pedidos de Compra"
        description="Crie e gerencie seus pedidos para fornecedores."
      >
        <Button asChild>
            <Link href="/dashboard/purchase-orders/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Pedido
            </Link>
        </Button>
      </PageHeader>
      <PurchaseOrderClient />
    </div>
  );
}
