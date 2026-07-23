
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import type { PurchaseOrder } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

const receiveItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantityOrdered: z.number(),
  quantityAlreadyReceived: z.number(),
  quantityReceived: z.coerce.number().int().min(0, "Deve ser >= 0"),
  cost: z.coerce.number().min(0, "Custo inválido"),
}).refine(data => data.quantityReceived <= (data.quantityOrdered - data.quantityAlreadyReceived), {
    message: "Não pode receber mais do que o pendente.",
    path: ["quantityReceived"],
});

const receiveSchema = z.object({
    items: z.array(receiveItemSchema)
});

type ReceiveFormData = z.infer<typeof receiveSchema>;

interface ReceiveOrderDialogProps {
  order: PurchaseOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (orderId: string, receivedItems: z.infer<typeof receiveItemSchema>[]) => Promise<void>;
}

export function ReceiveOrderDialog({ order, open, onOpenChange, onSubmit }: ReceiveOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ReceiveFormData>({
    resolver: zodResolver(receiveSchema),
    defaultValues: { items: [] }
  });

  const { fields, replace } = useFieldArray({
      control: form.control,
      name: "items"
  });

  React.useEffect(() => {
    if (order && open) {
      const defaultItems = order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantityOrdered: item.quantityOrdered,
        quantityAlreadyReceived: item.quantityReceived,
        quantityReceived: item.quantityOrdered - item.quantityReceived,
        cost: item.cost
      }));
      replace(defaultItems);
    }
  }, [order, open, replace]);

  const handleSubmit = async (data: ReceiveFormData) => {
    if (!order) return;
    const itemsToReceive = data.items.filter(item => item.quantityReceived > 0);
    if (itemsToReceive.length === 0) {
        onOpenChange(false);
        return;
    }
    
    setIsSubmitting(true);
    await onSubmit(order.id, itemsToReceive);
    setIsSubmitting(false);
    onOpenChange(false);
  };
  
  const watchedItems = form.watch('items');
  const totalCost = watchedItems.reduce((sum, item) => sum + (item.cost * (item.quantityReceived || 0)), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receber Mercadorias do Pedido</DialogTitle>
          <DialogDescription>
            Confirme as quantidades recebidas e os custos para cada item do pedido #{order?.id.substring(0, 8)}. O estoque será atualizado automaticamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <ScrollArea className="h-[50vh] pr-6">
                <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg bg-muted/50 space-y-2">
                        <p className="font-semibold">{field.productName}</p>
                        <div className="grid grid-cols-4 gap-4 items-end">
                             <div>
                                <Label>Pedido</Label>
                                <p className="font-mono text-sm h-10 flex items-center">{field.quantityOrdered}</p>
                            </div>
                             <div>
                                <Label>Recebido</Label>
                                <p className="font-mono text-sm h-10 flex items-center">{field.quantityAlreadyReceived}</p>
                            </div>
                             <FormField
                                control={form.control}
                                name={`items.${index}.quantityReceived`}
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Recebendo Agora</Label>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`items.${index}.cost`}
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Custo Unit. (R$)</Label>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                ))}
                </div>
            </ScrollArea>
            <DialogFooter className="mt-6 pt-4 border-t">
              <div className="w-full flex justify-between items-center">
                <div>
                  <span className="text-sm text-muted-foreground">Custo Total do Recebimento:</span>
                  <p className="text-2xl font-bold font-headline">R$ {totalCost.toFixed(2).replace('.',',')}</p>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Recebimento
                    </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
