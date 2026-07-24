
'use client';

import { useState } from 'react';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Supplier } from '@/lib/types';
import { maskCnpj, cleanCnpj, isValidCnpj, lookupCnpj, maskPhone, maskCep } from '@/lib/cnpj-lookup';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const supplierSchema = z.object({
  id: z.string().optional(),
  cnpj: z.string().optional().or(z.literal('')),
  name: z.string().min(3, 'O nome do fornecedor deve ter pelo menos 3 caracteres.'),
  tradeName: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zipCode: z.string().optional().or(z.literal('')),
  contactName: z.string().min(3, 'O nome de contato deve ter pelo menos 3 caracteres.').optional().or(z.literal('')),
  phone: z.string().min(10, 'O telefone parece inválido.').optional().or(z.literal('')),
  email: z.string().email('E-mail inválido.').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
}).refine((data) => !!data.phone || !!data.email, {
    message: "É necessário fornecer um telefone ou e-mail.",
    path: ["phone"],
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier: Supplier | null;
  onSubmit: (data: SupplierFormData) => void;
  onCancel: () => void;
}

export function SupplierForm({ supplier, onSubmit, onCancel }: SupplierFormProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [cnpjFound, setCnpjFound] = useState(false);
  const { toast } = useToast();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier || {
      cnpj: '',
      name: '',
      tradeName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      contactName: '',
      phone: '',
      email: '',
      notes: '',
    },
  });

  const handleCnpjLookup = async () => {
    const cnpj = form.getValues('cnpj') || '';
    const digits = cleanCnpj(cnpj);

    if (digits.length !== 14) {
      toast({ variant: 'destructive', title: 'CNPJ Inválido', description: 'O CNPJ deve ter 14 dígitos.' });
      return;
    }

    if (!isValidCnpj(digits)) {
      toast({ variant: 'destructive', title: 'CNPJ Inválido', description: 'Os dígitos verificadores do CNPJ estão incorretos.' });
      return;
    }

    setIsSearching(true);
    setCnpjFound(false);

    try {
      const result = await lookupCnpj(digits);
      
      form.setValue('name', result.razaoSocial, { shouldValidate: true });
      form.setValue('tradeName', result.nomeFantasia || '');
      form.setValue('address', result.endereco || '');
      form.setValue('city', result.cidade || '');
      form.setValue('state', result.estado || '');
      form.setValue('zipCode', result.cep ? maskCep(result.cep) : '');
      if (result.telefone) form.setValue('phone', maskPhone(result.telefone));
      if (result.email) form.setValue('email', result.email);

      setCnpjFound(true);
      toast({ title: 'CNPJ Encontrado!', description: `${result.razaoSocial} — ${result.situacao}` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro na Consulta', description: error.message || 'Não foi possível consultar o CNPJ.' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Seção: CNPJ + Busca Automática */}
        <div className="space-y-3 pb-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados da Empresa</p>
          <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="00.000.000/0000-00"
                      {...field}
                      onChange={(e) => {
                        field.onChange(maskCnpj(e.target.value));
                        setCnpjFound(false);
                      }}
                      maxLength={18}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCnpjLookup}
                    disabled={isSearching}
                    title="Buscar dados pelo CNPJ"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : cnpjFound ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormDescription>Digite o CNPJ e clique na lupa para preencher automaticamente.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razão Social</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Distribuidora de Bebidas XYZ Ltda" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tradeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Fantasia (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Bebidas XYZ" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Seção: Endereço */}
        <div className="space-y-3 pb-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço</p>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço (Opcional)</FormLabel>
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

        {/* Seção: Contato */}
        <div className="space-y-3 pb-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</p>
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Contato (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Carlos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contato@fornecedor.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Seção: Anotações */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anotações (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Informações adicionais sobre o fornecedor..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">Salvar Fornecedor</Button>
        </div>
      </form>
    </Form>
  );
}
