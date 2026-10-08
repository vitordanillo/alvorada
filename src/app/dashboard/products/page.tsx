
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductTable } from '@/components/products/product-table';
import { PageHeader } from '@/components/page-header';
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
import { ProductForm, type ProductFormData } from '@/components/products/product-form';
import type { Product } from '@/lib/types';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function ProductsPage() {
  const { products, addProduct, updateProduct, setProductStatus, loading } = useAppContext();
  const { toast } = useToast();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToChangeStatus, setProductToChangeStatus] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSelectionChange = (productIds: string[], select: boolean) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (select) {
        productIds.forEach(id => newSet.add(id));
      } else {
        productIds.forEach(id => newSet.delete(id));
      }
      return newSet;
    });
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsFormDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsFormDialogOpen(true);
  };
  
  const handleSetStatus = (product: Product) => {
    setProductToChangeStatus(product);
    setIsConfirmDialogOpen(true);
  };
  
  const confirmStatusChange = async () => {
    if (productToChangeStatus) {
      const { id, status } = productToChangeStatus;
      const newStatus = status === 'Ativo' ? 'Inativo' : 'Ativo';
      const actionText = newStatus === 'Inativo' ? 'inativado' : 'ativado';
      try {
        await setProductStatus(id, newStatus);
        toast({ title: "Sucesso!", description: `Produto ${actionText}.` });
        setIsConfirmDialogOpen(false);
        setProductToChangeStatus(null);
      } catch (error) {
        console.error(`Failed to ${actionText} product:`, error);
        toast({ variant: "destructive", title: "Erro!", description: `Não foi possível ${actionText} o produto.` });
      }
    }
  };

  const handleFormSubmit = async (productData: ProductFormData) => {
    try {
      if (selectedProduct) {
        // Preserve fields not on the form and override with new data
        const productToUpdate: Product = { 
            ...selectedProduct,
            ...productData,
            expiryDate: productData.expiryDate?.toISOString(),
        };
        await updateProduct(productToUpdate);
        toast({ title: "Sucesso!", description: "Produto atualizado." });
      } else {
        await addProduct(productData);
        toast({ title: "Sucesso!", description: "Produto adicionado." });
      }
      setIsFormDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Failed to save product:", error);
      toast({ variant: "destructive", title: "Erro!", description: "Não foi possível salvar o produto." });
    }
  };
  
  const handleDialogChange = (open: boolean) => {
    setIsFormDialogOpen(open);
    if (!open) {
      setSelectedProduct(null);
    }
  }
  
  const printUrl = `/dashboard/products/print-preview?ids=${Array.from(selectedProductIds).join(',')}`;

  return (
    <div className="flex flex-col gap-6">
       <PageHeader title="Produtos" description="Gerencie seus produtos aqui.">
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" disabled={selectedProductIds.size === 0}>
              <Link href={printUrl} target="_blank">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Etiquetas ({selectedProductIds.size})
              </Link>
            </Button>
            <Dialog open={isFormDialogOpen} onOpenChange={handleDialogChange}>
              <Button size="sm" className="gap-1 rounded-full" onClick={handleAddProduct}>
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Produto
              </Button>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>{selectedProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
                </DialogHeader>
                <ProductForm
                  key={selectedProduct?.id || 'new'}
                  product={selectedProduct}
                  onSubmit={handleFormSubmit}
                  onCancel={() => handleDialogChange(false)}
                />
              </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      {(!isClient || loading.products) ? (
         <Card className="rounded-2xl border-none shadow-sm bg-card p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
         </Card>
      ) : (
        <ProductTable 
            products={products} 
            onEdit={handleEditProduct} 
            onSetStatus={handleSetStatus} 
            selectedProducts={selectedProductIds}
            onSelectionChange={handleSelectionChange}
        />
      )}

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Esta ação vai ${productToChangeStatus?.status === 'Ativo' ? 'INATIVAR' : 'ATIVAR'} o produto "${productToChangeStatus?.name}". Produtos inativos não aparecem no PDV.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToChangeStatus(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
