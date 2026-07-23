
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Customer } from '@/lib/types';
import { Textarea } from '../ui/textarea';

const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  phone: z.string().min(10, 'O telefone parece inválido.'),
  email: z.string().email('E-mail inválido.').optional().or(z.literal('')),
  creditLimit: z.coerce.number({invalid_type_error: 'Limite inválido'}).min(0, 'O limite não pode ser negativo.'),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type CustomerFormData = Omit<z.infer<typeof customerSchema>, 'balance'>;


interface CustomerFormProps {
  customer: Omit<Customer, 'balance'> | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSubmit, onCancel }: CustomerFormProps) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      ...customer,
      tags: customer?.tags?.join(', ') || '',
    } || {
      name: '',
      phone: '',
      email: '',
      creditLimit: 0,
      notes: '',
      tags: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                            <Input placeholder="(11) 98765-4321" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>E-mail (Opcional)</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="joao@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="creditLimit"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Limite de Crédito (R$)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="500.00" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Tags (Opcional)</FormLabel>
                    <FormControl>
                        <Input placeholder="VIP, Empresa, Devedor..." {...field} />
                    </FormControl>
                     <FormDescription>Separe as tags por vírgula.</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Anotações (Opcional)</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Informações relevantes sobre o cliente..." {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Salvar Cliente</Button>
        </div>
      </form>
    </Form>
  );
}
