
'use client';

import * as React from 'react';
import {stockQuantityInput} from '@/lib/stock-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import type { Product, Supplier } from '@/lib/types';
import { Loader2, PlusCircle, Search, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type StockEntryItem = {
  product: Product;
  quantity: number;
  cost: number;
};

export function StockEntryClient() {
  const { suppliers, products, loading, addStockToProducts } = useAppContext();
  const { toast } = useToast();
  
  const [isClient, setIsClient] = React.useState(false);
  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [entryItems, setEntryItems] = React.useState<StockEntryItem[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddProduct = (product: Product) => {
    if (entryItems.some(item => item.product.id === product.id)) {
      toast({ variant: 'destructive', title: 'Produto já adicionado' });
      return;
    }
    setEntryItems(prev => [...prev, { product, quantity: 1, cost: product.averageCost || 0 }]);
  };

  const handleRemoveProduct = (productId: string) => {
    setEntryItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const newQuantity = Math.max(0, quantity);
    setEntryItems(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };
  
  const handleCostChange = (productId: string, cost: number) => {
    const newCost = Math.max(0, cost);
    setEntryItems(prev => prev.map(item =>
      item.product.id === productId ? { ...item, cost: newCost } : item
    ));
  };

  const handleSubmitEntry = async () => {
    if (entryItems.length === 0 || !selectedSupplier) {
      toast({ variant: 'destructive', title: 'Dados incompletos', description: 'Adicione itens e selecione um fornecedor.' });
      return;
    }
    if (entryItems.some(item => !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.cost) || item.cost < 0)) {
      toast({ variant: 'destructive', title: 'Verifique os dados.', description: 'A quantidade de todos os itens deve ser maior que zero e o custo não pode ser negativo.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsToUpdate = entryItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        cost: item.cost
      }));
      await addStockToProducts(itemsToUpdate, { id: selectedSupplier.id, name: selectedSupplier.name });
      toast({ title: 'Sucesso!', description: 'Estoque atualizado e entrada registrada nos logs.' });
      setEntryItems([]);
      setSelectedSupplier(null);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível atualizar o estoque.";
      toast({ variant: 'destructive', title: 'Erro!', description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return p.status === 'Ativo' &&
      (p.name.toLowerCase().includes(lowerCaseSearchTerm) ||
       (p.sku && p.sku.toLowerCase().includes(lowerCaseSearchTerm)));
  });
  
  const totalItems = entryItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = entryItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const isConfirmationDisabled = isSubmitting || entryItems.length === 0 || !selectedSupplier;

  if (!isClient || loading.suppliers || loading.products) {
    return <Skeleton className="w-full h-96" />
  }

  return (
    <AlertDialog>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="rounded-2xl border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Produtos para Entrada</CardTitle>
              <CardDescription>Busque por nome ou SKU e adicione os produtos que estão sendo recebidos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar produto por nome ou SKU..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Custo Médio</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(product => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>R$ {(product.averageCost || 0).toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell>{product.stock} {product.unit}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleAddProduct(product)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card className="rounded-2xl border-none shadow-sm bg-card sticky top-20">
            <CardHeader>
              <CardTitle>Resumo da Entrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Fornecedor *</Label>
                <Select 
                  onValueChange={(value) => setSelectedSupplier(suppliers.find(s => s.id === value) || null)}
                  value={selectedSupplier?.id || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {!selectedSupplier && entryItems.length > 0 && <p className='text-sm text-destructive mt-1'>Selecione o fornecedor para continuar.</p>}
              </div>
              <div className="max-h-64 overflow-auto space-y-2 pr-2">
                  {entryItems.length > 0 ? entryItems.map(item => {
                    const lastCost = item.product.costHistory?.length > 0 ? item.product.costHistory[item.product.costHistory.length - 1].cost : 0;
                    const avgCost = item.product.averageCost || 0;
                    const diffFromLast = lastCost > 0 ? ((item.cost - lastCost) / lastCost) * 100 : 0;
                    const diffFromAvg = avgCost > 0 ? ((item.cost - avgCost) / avgCost) * 100 : 0;

                    const getDiffClassName = (diff: number) => {
                        if (Math.abs(diff) < 0.01) return 'text-muted-foreground';
                        return diff < 0 ? 'text-green-600' : 'text-red-600';
                    };

                    const formatDiff = (diff: number) => {
                        if (Math.abs(diff) < 0.01) return '(=)';
                        return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
                    };

                    return (
                      <div key={item.product.id} className="space-y-2 border p-3 rounded-md bg-muted/20">
                          <div className="flex items-start justify-between">
                              <p className="text-sm font-medium pr-2">{item.product.name}</p>
                              <Button variant="ghost" size="icon" className="text-destructive -mr-2 -mt-2 shrink-0 h-7 w-7" onClick={() => handleRemoveProduct(item.product.id)}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                          <div className="flex items-end gap-2">
                              <div className='flex-1'>
                                  <Label htmlFor={`cost-${item.product.id}`} className="text-xs text-muted-foreground">Custo (R$)</Label>
                                  <Input 
                                      id={`cost-${item.product.id}`}
                                      type="number"
                                      step="0.01"
                                      value={item.cost}
                                      onChange={(e) => handleCostChange(item.product.id, parseFloat(e.target.value) || 0)}
                                      className="h-9"
                                  />
                              </div>
                               <div className='w-20 shrink-0'>
                                  <Label htmlFor={`qty-${item.product.id}`} className="text-xs text-muted-foreground">Qtd.</Label>
                                  <Input 
                                      id={`qty-${item.product.id}`}
                                      type="number" 
                                      value={item.quantity}
                                      onChange={(e) => handleQuantityChange(item.product.id, stockQuantityInput(e.target.value))}
                                      min="0.000001" step="any"
                                      className="h-9"
                                  />
                              </div>
                          </div>

                           {(lastCost > 0 || avgCost > 0) && item.cost > 0 && (
                                <div className="text-xs space-y-1 pt-2 mt-2 border-t border-dashed">
                                    {lastCost > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">vs. Últ. Compra (R$ {lastCost.toFixed(2).replace('.', ',')}):</span>
                                            <span className={cn('font-semibold', getDiffClassName(diffFromLast))}>
                                                {formatDiff(diffFromLast)}
                                            </span>
                                        </div>
                                    )}
                                    {avgCost > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">vs. Custo Médio (R$ {avgCost.toFixed(2).replace('.', ',')}):</span>
                                            <span className={cn('font-semibold', getDiffClassName(diffFromAvg))}>
                                                {formatDiff(diffFromAvg)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                      </div>
                    )
                  }) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto adicionado.</p>
                  )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-4 border-t">
              <div className="w-full flex justify-between">
                <span className="text-muted-foreground">Itens na lista</span>
                <span className="font-semibold">{entryItems.length}</span>
              </div>
              <div className="w-full flex justify-between">
                <span className="text-muted-foreground">Unidades Totais</span>
                <span className="font-semibold">{totalItems}</span>
              </div>
              <Separator />
              <div className="w-full flex justify-between font-bold text-lg">
                <span>Custo Total</span>
                <span className="font-headline">R$ {totalCost.toFixed(2).replace('.', ',')}</span>
              </div>
              <AlertDialogTrigger asChild>
                <Button 
                  className="w-full" 
                  size="lg" 
                  disabled={isConfirmationDisabled}
                >
                  Confirmar Entrada
                </Button>
              </AlertDialogTrigger>
            </CardFooter>
          </Card>
        </div>
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Entrada de Estoque</AlertDialogTitle>
          <AlertDialogDescription>
            A ação a seguir atualizará o estoque para os itens listados. Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 rounded-md border p-4">
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Fornecedor:</span>
              <span>{selectedSupplier?.name}</span>
            </div>
             <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Total de Unidades:</span>
              <span>{totalItems}</span>
            </div>
            <Separator/>
            <div className="flex justify-between font-bold text-xl">
              <span className="text-muted-foreground">Custo Total:</span>
              <span className="text-primary font-headline">R$ {totalCost.toFixed(2).replace('.', ',')}</span>
            </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmitEntry} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar e Atualizar Estoque
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
