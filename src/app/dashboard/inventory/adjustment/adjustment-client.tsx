
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {stockAdjustmentSchema as adjustmentSchema} from '@/lib/stock-input';
import { Check, ChevronsUpDown, Loader2, Minus, Plus, Search } from 'lucide-react';

import { useAppContext } from '@/context/app-context';
import type { Product, StockAdjustmentLog } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';


type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

export function StockAdjustmentClient() {
  const { products, loading, adjustStock } = useAppContext();
  const { toast } = useToast();

  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
  });

  React.useEffect(() => {
    if (selectedProduct) {
      form.reset({
        newQuantity: selectedProduct.stock,
        reason: undefined,
        notes: '',
      });
    }
  }, [selectedProduct, form]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsPopoverOpen(false);
  };

  const handleFormSubmit = (data: AdjustmentFormData) => {
    setIsConfirmOpen(true);
  };
  
  const confirmAdjustment = async () => {
    if (!selectedProduct) return;
    


    setIsSubmitting(true);
    try {
      const data = adjustmentSchema.parse(form.getValues());
      await adjustStock(selectedProduct.id, data.newQuantity, data.reason, data.notes);
      toast({ title: "Sucesso!", description: `Estoque de ${selectedProduct.name} ajustado com sucesso.` });
      setSelectedProduct(null);
      form.reset();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro!', description: error instanceof Error ? error.message : 'Não foi possível ajustar o estoque.' });
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  };
  
  const watchedNewQuantity = form.watch('newQuantity');
  const difference = selectedProduct != null && watchedNewQuantity != null
    ? watchedNewQuantity - selectedProduct.stock
    : 0;

  if (loading.products) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <>
      <Card className="rounded-2xl border-none shadow-sm bg-card">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <CardHeader>
              <CardTitle>Ajuste de Estoque</CardTitle>
              <CardDescription>Busque por um produto, informe a nova quantidade em estoque e o motivo do ajuste.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                  <h3 className="font-semibold">1. Selecione o Produto</h3>
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isPopoverOpen}
                        className="w-full justify-between"
                      >
                        {selectedProduct
                          ? selectedProduct.name
                          : "Selecione um produto..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar produto por nome ou SKU..." />
                        <CommandList>
                            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                            <CommandGroup>
                            {products.map((product) => (
                                <CommandItem
                                key={product.id}
                                value={product.name}
                                onSelect={() => handleProductSelect(product)}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {product.name}
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedProduct && (
                     <Card className="bg-muted/50">
                        <CardContent className="p-4 space-y-2 text-sm">
                           <p><strong>SKU:</strong> {selectedProduct.sku}</p>
                           <p><strong>Estoque Atual:</strong> {selectedProduct.stock} {selectedProduct.unit}</p>
                        </CardContent>
                     </Card>
                  )}
              </div>

              {selectedProduct && (
                <div className="space-y-4">
                    <h3 className="font-semibold">2. Informe o Ajuste</h3>
                    <div className="grid grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="newQuantity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nova Quantidade</FormLabel>
                                <FormControl>
                                    <Input type="number" min="0" step="any" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div>
                            <FormLabel>Diferença</FormLabel>
                            <div 
                                className={cn(
                                "flex items-center justify-center h-10 rounded-md border text-lg font-bold",
                                difference === 0 && "border-input",
                                difference > 0 && "border-green-500 bg-green-500/10 text-green-700",
                                difference < 0 && "border-red-500 bg-red-500/10 text-red-700"
                                )}
                            >
                                {difference > 0 ? `+${difference}` : difference}
                            </div>
                         </div>
                    </div>
                     <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Motivo do Ajuste</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um motivo" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Contagem">Acerto de Contagem</SelectItem>
                                    <SelectItem value="Perda">Perda ou Furto</SelectItem>
                                    <SelectItem value="Avaria">Avaria / Vencimento</SelectItem>
                                    <SelectItem value="Doação">Doação</SelectItem>
                                    <SelectItem value="Outro">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Observações (Opcional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Descreva mais detalhes sobre o ajuste, se necessário." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
              )}
            </CardContent>
            {selectedProduct && (
              <CardFooter className="border-t pt-6">
                <Button type="submit" size="lg" disabled={!selectedProduct}>Ajustar Estoque</Button>
              </CardFooter>
            )}
          </form>
        </Form>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Ajuste de Estoque</AlertDialogTitle>
                 <AlertDialogDescription>
                    Você está prestes a alterar o estoque do produto. Essa ação é irreversível.
                </AlertDialogDescription>
            </AlertDialogHeader>
            {selectedProduct && (
                 <div className="space-y-4 rounded-md border p-4">
                    <div className="font-semibold">{selectedProduct.name}</div>
                    <Separator/>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Estoque Anterior:</span>
                        <span>{selectedProduct.stock}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Novo Estoque:</span>
                        <span className="font-bold">{form.getValues('newQuantity')}</span>
                    </div>
                     <div className="flex justify-between font-bold text-lg">
                        <span className="text-muted-foreground">Ajuste Total:</span>
                        <span className={cn(
                            difference > 0 && "text-green-600",
                            difference < 0 && "text-red-600"
                        )}>
                            {difference > 0 ? `+${difference}` : difference} {selectedProduct.unit}
                        </span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Motivo:</span>
                        <span>{form.getValues('reason')}</span>
                    </div>
                 </div>
            )}
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAdjustment} disabled={isSubmitting}>
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar Ajuste
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
