
'use client';

import * as React from 'react';
import { useAppContext } from "@/context/app-context";
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { PurchaseOrderTable } from '@/components/purchase-orders/po-table';
import { ReceiveOrderDialog } from '@/components/purchase-orders/po-receive-dialog';
import type { PurchaseOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function PurchaseOrderClient() {
  const { purchaseOrders, loading, receivePurchaseOrder } = useAppContext();
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = React.useState(false);
  const [orderToReceive, setOrderToReceive] = React.useState<PurchaseOrder | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenReceiveDialog = (order: PurchaseOrder) => {
    setOrderToReceive(order);
    setIsReceiveDialogOpen(true);
  };

  const handleReceiveSubmit = async (orderId: string, receivedItems: any[]) => {
    try {
      await receivePurchaseOrder(orderId, receivedItems);
      toast({
        title: "Sucesso!",
        description: "Recebimento registrado e estoque atualizado."
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: "Erro!",
        description: error instanceof Error ? error.message : "Não foi possível processar o recebimento."
      });
    }
  };

  if (!isClient || loading.purchaseOrders) {
    return (
      <Card className="rounded-2xl border-none shadow-sm bg-card p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <PurchaseOrderTable orders={purchaseOrders} onReceive={handleOpenReceiveDialog} />
      <ReceiveOrderDialog 
        order={orderToReceive}
        open={isReceiveDialogOpen}
        onOpenChange={setIsReceiveDialogOpen}
        onSubmit={handleReceiveSubmit}
      />
    </>
  );
}
