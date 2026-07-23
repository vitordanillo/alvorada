
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/page-header";
import { useAppContext } from "@/context/app-context";
import { SalesTable } from '@/components/sales/sales-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import type { Sale } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { CancelSaleDialog } from '@/components/sales/cancel-sale-dialog';

export default function SalesPage() {
  const { sales, loading, cancelSale, user } = useAppContext();
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenCancelDialog = (sale: Sale) => {
    if (user?.role !== 'Administrador' && user?.role !== 'Gerente') {
      toast({
        variant: "destructive",
        title: "Acesso Negado",
        description: "Você não tem permissão para cancelar vendas.",
      });
      return;
    }
    setSelectedSale(sale);
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancellation = async (saleId: string, reason: string, passwordAttempt: string) => {
    try {
      await cancelSale(saleId, reason, passwordAttempt);
      toast({
        title: "Sucesso!",
        description: "A venda foi cancelada e o estoque foi revertido.",
      });
      setIsCancelDialogOpen(false);
      setSelectedSale(null);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
      toast({
        variant: "destructive",
        title: "Erro ao Cancelar Venda",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Histórico de Vendas"
        description="Visualize e gerencie todas as vendas registradas no sistema."
      />
      {(!isClient || loading.sales) ? (
        <Card className="rounded-2xl border-none shadow-sm bg-card p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </Card>
      ) : (
        <SalesTable sales={sales} onCancel={handleOpenCancelDialog} />
      )}
      
      {selectedSale && (
        <CancelSaleDialog
          sale={selectedSale}
          open={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
          onSubmit={handleConfirmCancellation}
        />
      )}
    </div>
  );
}
