
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { useAppContext } from '@/context/app-context';
import type { PurchaseOrder, PurchaseOrderItem, Product, Supplier } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

const poItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantityOrdered: z.coerce.number().positive("A quantidade deve ser maior que 0."),
  cost: z.coerce.number().min(0, "O custo não pode ser negativo."),
});

const poSchema = z.object({
  supplierId: z.string({ required_error: "Selecione um fornecedor." }),
  dateExpected: z.date({ required_error: "A data de entrega prevista é obrigatória." }),
  notes: z.string().optional(),
  items: z.array(poItemSchema).min(1, "O pedido deve ter pelo menos um item."),
});

type POFormData = z.infer<typeof poSchema>;

interface PurchaseOrderFormProps {
  existingOrder?: PurchaseOrder;
}

export function PurchaseOrderForm({ existingOrder }: PurchaseOrderFormProps) {
  const { suppliers, products, addPurchaseOrder, updatePurchaseOrder } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isProductPopoverOpen, setIsProductPopoverOpen] = React.useState(false);

  const form = useForm<POFormData>({
    resolver: zodResolver(poSchema),
    defaultValues: existingOrder ? {
      supplierId: existingOrder.supplierId,
      dateExpected: new Date(existingOrder.dateExpected),
      notes: existingOrder.notes || '',
      items: existingOrder.items,
    } : {
      items: [],
      notes: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
    keyName: "key"
  });

  const selectedSupplierId = form.watch('supplierId');
  const items = form.watch('items');
  const totalCost = items.reduce((sum, item) => sum + (item.cost * item.quantityOrdered), 0);

  const handleAddProduct = (product: Product) => {
    if (fields.some(item => item.productId === product.id)) {
      toast({ variant: 'destructive', title: 'Produto já adicionado' });
      return;
    }
    append({
      productId: product.id,
      productName: product.name,
      quantityOrdered: 1,
      cost: product.averageCost || 0,
    });
    setIsProductPopoverOpen(false);
  }

  const onSubmit = async (data: POFormData) => {
    setIsSubmitting(true);
    try {
      const supplier = suppliers.find(s => s.id === data.supplierId);
      if (!supplier) throw new Error("Fornecedor não encontrado");

      const orderData = {
        ...data,
        dateExpected: data.dateExpected.toISOString(),
        supplierName: supplier.name,
        totalCost: totalCost,
        items: data.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          cost: item.cost,
          quantityOrdered: item.quantityOrdered,
          quantityReceived: (item as any).quantityReceived || 0,
        })),
      };

      if (existingOrder) {
        await updatePurchaseOrder(existingOrder.id, orderData);
        toast({ title: "Sucesso!", description: "Pedido de compra atualizado." });
        if(!navigator.onLine)location.assign('/dashboard/purchase-orders');else router.push('/dashboard/purchase-orders');
      } else {
        const newOrderId = await addPurchaseOrder(orderData);
        toast({ title: "Sucesso!", description: "Pedido de compra criado." });
        if(!navigator.onLine)location.assign('/dashboard/purchase-orders');else router.push('/dashboard/purchase-orders');
      }

    } catch (error) {
      console.error("Failed to save purchase order:", error);
      toast({ variant: 'destructive', title: 'Erro!', description: error instanceof Error ? error.message : "Não foi possível salvar o pedido." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card className="rounded-2xl border-none shadow-sm bg-card">
              <CardHeader>
                <CardTitle>Itens do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((item, index) => (
                  <div key={item.key} className="flex flex-col sm:flex-row gap-4 items-start p-4 border rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">ID: {item.productId}</p>
                    </div>
                    <div className="flex gap-4">
                       <FormField
                          control={form.control}
                          name={`items.${index}.cost`}
                          render={({ field }) => (
                            <FormItem className="w-28">
                              <FormLabel>Custo (R$)</FormLabel>
                              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name={`items.${index}.quantityOrdered`}
                          render={({ field }) => (
                            <FormItem className="w-24">
                              <FormLabel>Quantidade</FormLabel>
                                <FormControl><Input type="number" min="0.000001" step="any" {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                 <FormMessage>{form.formState.errors.items?.root?.message}</FormMessage>

                <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar produto..." />
                      <CommandList>
                        <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                        <CommandGroup>
                          {products.filter(p => p.status === 'Ativo').map(product => (
                            <CommandItem key={product.id} value={product.name} onSelect={() => handleAddProduct(product)}>
                              <Check className={cn("mr-2 h-4 w-4", fields.some(f => f.productId === product.id) ? "opacity-100" : "opacity-0")} />
                              {product.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="rounded-2xl border-none shadow-sm bg-card sticky top-20">
              <CardHeader>
                <CardTitle>Detalhes do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!existingOrder}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="dateExpected"
                    render={({ field }) => (
                        <FormItem className='flex flex-col'>
                            <FormLabel>Data de Entrega Prevista</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "P", { locale: ptBR}) : <span>Escolha uma data</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl><Textarea placeholder="Detalhes adicionais sobre o pedido..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-4 border-t">
                  <div className="w-full flex justify-between font-bold text-lg">
                    <span>Custo Total</span>
                    <span className="font-headline">R$ {totalCost.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <Separator />
                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {existingOrder ? 'Salvar Alterações' : 'Criar Pedido de Compra'}
                  </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
