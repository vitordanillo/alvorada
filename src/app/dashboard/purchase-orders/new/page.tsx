
import { PageHeader } from "@/components/page-header";
import { PurchaseOrderForm } from "@/components/purchase-orders/po-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewPurchaseOrderPage() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Novo Pedido de Compra"
                description="Selecione um fornecedor e adicione os produtos para criar um novo pedido."
            >
                <Button variant="outline" asChild>
                    <Link href="/dashboard/purchase-orders">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Voltar
                    </Link>
                </Button>
            </PageHeader>
            <PurchaseOrderForm />
        </div>
    )
}
