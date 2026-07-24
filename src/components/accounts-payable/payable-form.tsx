
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { AccountsPayable } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAppContext } from '@/context/app-context';

const formSchema = z.object({
  description: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres.'),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  category: z.string().optional(),
  dueDate: z.date({ required_error: 'A data de vencimento é obrigatória.'}),
  supplierId: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface AccountsPayableFormProps {
  payable: AccountsPayable | null;
  onSubmit: (data: Omit<AccountsPayable, 'id' | 'status' | 'registeredBy' | 'paymentDate' | 'dateCreated'>) => void;
  onCancel: () => void;
}

export function AccountsPayableForm({ payable, onSubmit, onCancel }: AccountsPayableFormProps) {
  const { suppliers } = useAppContext();
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        description: payable?.description || '',
        amount: payable?.amount || 0,
        category: payable?.category || undefined,
        dueDate: payable?.dueDate ? new Date(payable.dueDate) : undefined,
        supplierId: payable?.supplierId || undefined,
    },
  });

  const handleSubmit = (data: FormSchema) => {
    const isNoSupplier = !data.supplierId || data.supplierId === 'none';
    const supplier = isNoSupplier ? undefined : suppliers.find(s => s.id === data.supplierId);
    onSubmit({
        description: data.description,
        amount: data.amount,
        category: (!data.category || data.category === 'none') ? undefined : data.category,
        dueDate: data.dueDate.toISOString(),
        supplierId: isNoSupplier ? undefined : data.supplierId,
        supplierName: supplier?.name,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Aluguel da loja" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="1500.00" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                    <FormItem className='flex flex-col pt-2'>
                        <FormLabel>Data de Vencimento</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "dd/MM/yyyy", { locale: ptBR})
                                    ) : (
                                        <span>Escolha uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date("1900-01-01") }
                                    initialFocus
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="Aluguel">Aluguel</SelectItem>
                    <SelectItem value="Energia">Energia</SelectItem>
                    <SelectItem value="Água">Água</SelectItem>
                    <SelectItem value="Internet">Internet</SelectItem>
                    <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                    <SelectItem value="Salários">Salários</SelectItem>
                    <SelectItem value="Impostos">Impostos</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Associe a um fornecedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
