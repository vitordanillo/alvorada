
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import type { Customer } from '@/lib/types';
import { Separator } from '../ui/separator';


interface CustomerPaymentDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number) => Promise<void>;
}

export function CustomerPaymentDialog({ customer, open, onOpenChange, onSubmit }: CustomerPaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const paymentSchema = z.object({
    amount: z.coerce
        .number({ invalid_type_error: 'O valor é obrigatório.'})
        .positive('O valor do pagamento deve ser maior que zero.')
        .max(customer.balance, `O valor não pode ser maior que o saldo devedor de R$ ${customer.balance.toFixed(2)}`),
  });
  
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0 },
  });

  const handleSubmit = async (data: z.infer<typeof paymentSchema>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data.amount);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Registre um pagamento para abater do saldo devedor de <strong>{customer.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-3 rounded-md border bg-muted/50 p-4">
              <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">Saldo Devedor Atual:</span>
                  <span className='font-bold text-destructive'>R$ {customer.balance.toFixed(2).replace('.', ',')}</span>
              </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Pagamento (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Ex: 50.00"
              {...form.register('amount')}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isSubmitting}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
