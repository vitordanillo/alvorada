
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
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import type { Sale } from '@/lib/types';

const cancelSchema = z.object({
  reason: z.string().min(10, 'O motivo deve ter pelo menos 10 caracteres.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
});

interface CancelSaleDialogProps {
  sale: Sale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (saleId: string, reason: string, passwordAttempt: string) => Promise<void>;
}

export function CancelSaleDialog({ sale, open, onOpenChange, onSubmit }: CancelSaleDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<z.infer<typeof cancelSchema>>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: '', password: '' },
  });

  const handleSubmit = async (data: z.infer<typeof cancelSchema>) => {
    setIsSubmitting(true);
    await onSubmit(sale.id, data.reason, data.password);
    setIsSubmitting(false);
  };
  
  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Venda</DialogTitle>
          <DialogDescription>
            Esta ação é irreversível. O estoque dos produtos será revertido e a transação financeira será anulada.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                    <FormItem>
                        <Label>Motivo do Cancelamento</Label>
                        <FormControl>
                            <Textarea placeholder="Ex: Cliente desistiu da compra." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                        <Label>Senha de Autorização</Label>
                        <FormControl>
                            <Input type="password" placeholder="Digite a senha para confirmar" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Voltar</Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Cancelamento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
