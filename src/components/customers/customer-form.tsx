
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
import { maskCpfCnpj, maskPhone, maskCep } from '@/lib/cnpj-lookup';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  cpfCnpj: z.string().optional().or(z.literal('')),
  birthDate: z.date().optional().nullable(),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zipCode: z.string().optional().or(z.literal('')),
  phone: z.string().min(10, 'O telefone parece inválido.'),
  email: z.string().email('E-mail inválido.').optional().or(z.literal('')),
  creditLimit: z.coerce.number({invalid_type_error: 'Limite inválido'}).min(0, 'O limite não pode ser negativo.'),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;


interface CustomerFormProps {
  customer: Omit<Customer, 'balance'> | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSubmit, onCancel }: CustomerFormProps) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ? {
      name: customer.name || '',
      cpfCnpj: customer.cpfCnpj || '',
      birthDate: customer.birthDate ? new Date(customer.birthDate) : null,
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      zipCode: customer.zipCode || '',
      phone: customer.phone || '',
      email: customer.email || '',
      creditLimit: customer.creditLimit || 0,
      notes: customer.notes || '',
      tags: customer.tags?.join(', ') || '',
    } : {
      name: '',
      cpfCnpj: '',
      birthDate: null,
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      creditLimit: 0,
      notes: '',
      tags: '',
    },
  });

  const handleFormSubmit = (data: CustomerFormData) => {
    onSubmit({
      ...data,
      birthDate: data.birthDate ? data.birthDate.toISOString() : undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Seção: Dados Pessoais */}
        <div className="space-y-3 pb-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados Pessoais</p>
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
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="cpfCnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF / CNPJ (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="000.000.000-00"
                      {...field}
                      onChange={(e) => field.onChange(maskCpfCnpj(e.target.value))}
                      maxLength={18}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel>Data de Nascimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        locale={ptBR}
                        captionLayout="dropdown-buttons"
                        fromYear={1930}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Seção: Contato */}
        <div className="space-y-3 pb-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</p>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(11) 98765-4321"
                      {...field}
                      onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      maxLength={15}
                    />
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
        </div>

        {/* Seção: Endereço */}
        <div className="space-y-3 pb-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço (Opcional)</p>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, número, bairro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="São Paulo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UF</FormLabel>
                  <FormControl>
                    <Input placeholder="SP" maxLength={2} {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="00000-000"
                      {...field}
                      onChange={(e) => field.onChange(maskCep(e.target.value))}
                      maxLength={9}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Seção: Financeiro */}
        <div className="space-y-3 pb-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financeiro</p>
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
        </div>

        {/* Tags e Anotações */}
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
