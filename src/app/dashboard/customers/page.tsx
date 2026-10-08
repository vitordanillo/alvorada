
'use client';

import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { CustomerTable } from '@/components/customers/customer-table';
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
import { CustomerForm } from '@/components/customers/customer-form';
import type { Customer, CashTransaction } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { CustomerPaymentDialog } from '@/components/customers/customer-payment-dialog';
import { PaymentReceiptDialog } from '@/components/customers/payment-receipt-dialog';


export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, addCreditPayment, loading, activeSession, user } = useAppContext();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerToPay, setCustomerToPay] = useState<Customer | null>(null);
  const [receiptData, setReceiptData] = useState<{ transaction: CashTransaction; customer: Customer } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleRegisterPayment = (customer: Customer) => {
    if (!activeSession) {
      toast({
        variant: "destructive",
        title: "Caixa Fechado",
        description: "É necessário ter um caixa aberto para registrar pagamentos.",
      });
      return;
    }
    setCustomerToPay(customer);
    setIsPaymentDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (customerToDelete) {
      try {
        await deleteCustomer(customerToDelete.id);
        toast({ title: "Sucesso!", description: "Cliente excluído." });
        setIsDeleteDialogOpen(false);
        setCustomerToDelete(null);
      } catch (error) {
        console.error("Failed to delete customer:", error);
        toast({ variant: "destructive", title: "Erro!", description: "Não foi possível excluir o cliente." });
      }
    }
  };

  const handleFormSubmit = async (data: Omit<Customer, 'id' | 'balance' | 'tags'> & { id?: string, tags?: string }) => {
    try {
        const dataToSave = {
          ...data,
          tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        };

        if (selectedCustomer) {
          const customerToUpdate: Customer = {
              ...selectedCustomer,
              ...dataToSave,
          };
          await updateCustomer(customerToUpdate);
          toast({ title: "Sucesso!", description: "Cliente atualizado." });
        } else {
          await addCustomer(dataToSave);
          toast({ title: "Sucesso!", description: "Cliente adicionado." });
        }
        setIsDialogOpen(false);
        setSelectedCustomer(null);
    } catch(error) {
        console.error("Failed to save customer:", error);
        toast({ variant: "destructive", title: "Erro!", description: "Não foi possível salvar o cliente." });
    }
  };


  const handlePaymentSubmit = async (amount: number) => {
    if (!customerToPay) return;
    try {
      const newTransaction = await addCreditPayment(customerToPay.id, amount);
      toast({ title: 'Sucesso!', description: `Pagamento de R$ ${amount.toFixed(2)} registrado para ${customerToPay.name}.` });
      setIsPaymentDialogOpen(false);
      setReceiptData({ transaction: newTransaction, customer: customerToPay });
      setCustomerToPay(null);
    } catch (error) {
       console.error("Failed to register payment:", error);
       const errorMessage = error instanceof Error ? error.message : "Não foi possível registrar o pagamento.";
       toast({ variant: "destructive", title: "Erro!", description: errorMessage });
    }
  };
  
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedCustomer(null);
    }
  };

  const handleSendWhatsApp = async (customer: Customer) => {
    try {
      const { sendWhatsAppBillingAction } = await import('@/lib/db-actions');
      const result = await sendWhatsAppBillingAction(customer.id, user?.storeId);
      if (result.success && result.whatsappUrl) {
        toast({
          title: "Cobrança WhatsApp",
          description: result.message,
          className: "bg-green-100 border-green-500 text-green-800"
        });
        window.open(result.whatsappUrl, '_blank');
      } else {
        toast({ variant: "destructive", title: "Erro", description: result.message });
      }
    } catch (error) {
      console.error("Failed to send WhatsApp billing:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível disparar o WhatsApp de cobrança." });
    }
  };

  return (
    <div className="flex flex-col gap-6">
       <PageHeader title="Clientes" description="Gerencie sua base de clientes.">
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <Button size="sm" className="gap-1 rounded-full" onClick={handleAddCustomer}>
              <PlusCircle className="h-4 w-4" />
              Adicionar Cliente
          </Button>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>{selectedCustomer ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <CustomerForm
              key={selectedCustomer?.id || 'new'}
              customer={selectedCustomer}
              onSubmit={handleFormSubmit}
              onCancel={() => handleDialogChange(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>
      {(!isClient || loading.customers) ? (
        <Card className="rounded-2xl border-none shadow-sm bg-card p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </Card>
      ) : (
        <CustomerTable 
          customers={customers} 
          onEdit={handleEditCustomer} 
          onDelete={handleDeleteCustomer} 
          onRegisterPayment={handleRegisterPayment} 
          onSendWhatsApp={handleSendWhatsApp}
        />
      )}

      {customerToPay && (
        <CustomerPaymentDialog 
            customer={customerToPay}
            open={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
            onSubmit={handlePaymentSubmit}
        />
      )}

      {receiptData && (
        <PaymentReceiptDialog
          data={receiptData}
          open={!!receiptData}
          onOpenChange={() => setReceiptData(null)}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente
              "{customerToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
