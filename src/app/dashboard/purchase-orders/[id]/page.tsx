
'use client';

import { useParams } from "next/navigation";
import { useAppContext } from "@/context/app-context";
import { PageHeader } from "@/components/page-header";
import { PurchaseOrderForm } from "@/components/purchase-orders/po-form";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import * as React from "react";

export default function EditPurchaseOrderPage() {
    const params = useParams();
    const { id } = params;
    const { purchaseOrders, loading } = useAppContext();
    const [isClient, setIsClient] = React.useState(false);
    
    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const order = purchaseOrders.find(o => o.id === id);

    if (!isClient || loading.purchaseOrders) {
        return (
            <div className="flex flex-col gap-6">
                 <PageHeader title="Carregando Pedido..." />
                 <Skeleton className="h-96 w-full"/>
            </div>
        )
    }

    if (!order) {
        return (
             <div className="flex flex-col gap-6">
                <PageHeader title="Pedido não encontrado" description="O pedido que você está procurando não existe." >
                     <Button asChild variant="outline">
                        <Link href="/dashboard/purchase-orders">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                </PageHeader>
             </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={`Editar Pedido de Compra #${id.substring(0, 8)}`}
                description={`Alterando o pedido para o fornecedor ${order.supplierName}.`}
            >
                <Button variant="outline" asChild>
                    <Link href="/dashboard/purchase-orders">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Voltar
                    </Link>
                </Button>
            </PageHeader>
            <PurchaseOrderForm existingOrder={order} />
        </div>
    )
}
