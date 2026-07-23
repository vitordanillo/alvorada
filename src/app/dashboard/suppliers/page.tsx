
'use client';

import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { SupplierTable } from '@/components/suppliers/supplier-table';
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
import { SupplierForm } from '@/components/suppliers/supplier-form';
import type { Supplier } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, loading } = useAppContext();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setIsDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };
  
  const handleDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (supplierToDelete) {
      try {
        await deleteSupplier(supplierToDelete.id);
        toast({ title: "Sucesso!", description: "Fornecedor excluído." });
        setIsDeleteDialogOpen(false);
        setSupplierToDelete(null);
      } catch (error) {
        console.error("Failed to delete supplier:", error);
        toast({ variant: "destructive", title: "Erro!", description: "Não foi possível excluir o fornecedor." });
      }
    }
  };

  const handleFormSubmit = async (supplierData: Omit<Supplier, 'id'> & { id?: string }) => {
    try {
        if (selectedSupplier) {
          await updateSupplier({ ...supplierData, id: selectedSupplier.id } as Supplier);
          toast({ title: "Sucesso!", description: "Fornecedor atualizado." });
        } else {
          await addSupplier(supplierData);
          toast({ title: "Sucesso!", description: "Fornecedor adicionado." });
        }
        setIsDialogOpen(false);
        setSelectedSupplier(null);
    } catch(error) {
        console.error("Failed to save supplier:", error);
        toast({ variant: "destructive", title: "Erro!", description: "Não foi possível salvar o fornecedor." });
    }
  };
  
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedSupplier(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
       <PageHeader title="Fornecedores" description="Gerencie seus fornecedores aqui.">
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <Button size="sm" className="gap-1 rounded-full" onClick={handleAddSupplier}>
              <PlusCircle className="h-4 w-4" />
              Adicionar Fornecedor
          </Button>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>{selectedSupplier ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</DialogTitle>
            </DialogHeader>
            <SupplierForm
              key={selectedSupplier?.id || 'new'}
              supplier={selectedSupplier}
              onSubmit={handleFormSubmit}
              onCancel={() => handleDialogChange(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>
      {(!isClient || loading.suppliers) ? (
        <Card className="rounded-2xl border-none shadow-sm bg-card p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </Card>
      ) : (
        <SupplierTable suppliers={suppliers} onEdit={handleEditSupplier} onDelete={handleDeleteSupplier} />
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o fornecedor
              "{supplierToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
