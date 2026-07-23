
'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountsPayableTable } from '@/components/accounts-payable/payable-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AccountsPayableForm } from '@/components/accounts-payable/payable-form';
import type { AccountsPayable } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function AccountsPayableClient() {
  const { accountsPayable, addPayable, updatePayable, deletePayable, markPayableAsPaid, loading } = useAppContext();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isPayOpen, setIsPayOpen] = React.useState(false);

  const [selectedPayable, setSelectedPayable] = React.useState<AccountsPayable | null>(null);
  const [payableToAction, setPayableToAction] = React.useState<AccountsPayable | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAdd = () => {
    setSelectedPayable(null);
    setIsFormOpen(true);
  };

  const handleEdit = (payable: AccountsPayable) => {
    setSelectedPayable(payable);
    setIsFormOpen(true);
  };

  const handleDelete = (payable: AccountsPayable) => {
    setPayableToAction(payable);
    setIsDeleteOpen(true);
  };

  const handlePay = (payable: AccountsPayable) => {
    setPayableToAction(payable);
    setIsPayOpen(true);
  };

  const confirmDelete = async () => {
    if (payableToAction) {
      try {
        await deletePayable(payableToAction.id);
        toast({ title: "Sucesso!", description: "Conta a pagar excluída." });
      } catch (error) {
        console.error("Failed to delete payable:", error);
        toast({ variant: "destructive", title: "Erro!", description: error instanceof Error ? error.message : "Não foi possível excluir." });
      } finally {
        setIsDeleteOpen(false);
        setPayableToAction(null);
      }
    }
  };

  const confirmPayment = async (fromCashRegister: boolean) => {
    if (payableToAction) {
      try {
        await markPayableAsPaid(payableToAction.id, fromCashRegister);
        toast({ title: "Sucesso!", description: "Conta marcada como paga." });
      } catch (error) {
        console.error("Failed to mark payable as paid:", error);
        toast({ variant: "destructive", title: "Erro!", description: error instanceof Error ? error.message : "Não foi possível marcar como pago." });
      } finally {
        setIsPayOpen(false);
        setPayableToAction(null);
      }
    }
  };

  const handleFormSubmit = async (data: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => {
    try {
        if (selectedPayable) {
          await updatePayable(selectedPayable.id, data);
          toast({ title: "Sucesso!", description: "Conta atualizada." });
        } else {
          await addPayable(data);
          toast({ title: "Sucesso!", description: "Conta adicionada." });
        }
        setIsFormOpen(false);
    } catch(error) {
        console.error("Failed to save payable:", error);
        toast({ variant: "destructive", title: "Erro!", description: "Não foi possível salvar." });
    }
  };
  
  const handleDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedPayable(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="flex justify-end">
        <Dialog open={isFormOpen} onOpenChange={handleDialogChange}>
          <Button size="sm" className="gap-1 rounded-full" onClick={handleAdd}>
              <PlusCircle className="h-4 w-4" />
              Adicionar Conta
          </Button>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>{selectedPayable ? 'Editar Conta' : 'Adicionar Nova Conta a Pagar'}</DialogTitle>
            </DialogHeader>
            <AccountsPayableForm
              key={selectedPayable?.id || 'new'}
              payable={selectedPayable}
              onSubmit={handleFormSubmit}
              onCancel={() => handleDialogChange(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {(!isClient || loading.accountsPayable) ? (
        <Card className="rounded-2xl border-none shadow-sm bg-card p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </Card>
      ) : (
        <AccountsPayableTable payables={accountsPayable} onEdit={handleEdit} onDelete={handleDelete} onPay={handlePay} />
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente a conta: "{payableToAction?.description}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPayableToAction(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Como este pagamento foi realizado?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => confirmPayment(true)}>
              Pagar com o Caixa Aberto
            </Button>
            <Button onClick={() => confirmPayment(false)}>
              Pagamento Externo (fora do caixa)
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
