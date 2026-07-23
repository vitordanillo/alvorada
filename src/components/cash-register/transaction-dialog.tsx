'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';

const transactionSchema = z.object({
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  description: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres.'),
});

interface TransactionDialogProps {
  type: 'Despesa' | 'Sangria';
  onSubmit: (data: z.infer<typeof transactionSchema>) => Promise<void>;
  children: React.ReactNode;
}

export function TransactionDialog({ type, onSubmit, children }: TransactionDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { amount: 0, description: '' },
  });

  const handleSubmit = async (data: z.infer<typeof transactionSchema>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar {type}</DialogTitle>
          <DialogDescription>
            {type === 'Despesa'
              ? 'Registre uma saída de dinheiro do caixa para pagar uma conta ou fornecedor.'
              : 'Registre uma retirada de dinheiro do caixa para o cofre.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
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
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder={type === 'Despesa' ? 'Ex: Pagamento conta de luz' : 'Ex: Retirada para o cofre'}
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar {type}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
