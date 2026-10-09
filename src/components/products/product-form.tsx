
'use client';

import {useEffect,useState} from 'react';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {DEFAULT_MEASURE_UNITS,type MeasureUnit} from '@/lib/measure-units';
import {getMeasureUnitsAction,createMeasureUnitAction} from '@/lib/measure-unit-actions';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Product } from '@/lib/types';
import { useAppContext } from '@/context/app-context';

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  description: z.string().optional().or(z.literal('')),
  brand: z.string().optional().or(z.literal('')),
  barcode: z.string().optional(),
  category: z.enum(['Alimentos', 'Limpeza', 'Higiene', 'Bebidas', 'Outros'], {
    required_error: 'Selecione uma categoria.',
  }),
  price: z.coerce.number({invalid_type_error: 'Preço inválido'}).positive('O preço deve ser positivo.'),
  stock: z.coerce.number({invalid_type_error: 'Estoque inválido'}).int().min(0, 'O estoque não pode ser negativo.'),
  minStock: z.coerce.number({invalid_type_error: 'Estoque mínimo inválido'}).int().min(0, 'O estoque mínimo não pode ser negativo.'),
  unit: z.string().min(1, 'A unidade é obrigatória.'),
  supplier: z.string().optional(),
  measurement:z.object({factor:z.coerce.number().positive().max(1000000),baseUnit:z.enum(['L','kg','un'])}).optional(),
  expiryDate: z.date().optional().nullable(),
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product: Product | null;
  onSubmit: (data: ProductFormData) => Promise<void>|void;
  onCancel: () => void;
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const { suppliers,user } = useAppContext();
  const [units,setUnits]=useState<MeasureUnit[]>(DEFAULT_MEASURE_UNITS),[unitLabel,setUnitLabel]=useState(''),[unitFactor,setUnitFactor]=useState(''),[unitBase,setUnitBase]=useState<'L'|'kg'|'un'>('L'),[savingUnit,setSavingUnit]=useState(false),[unitError,setUnitError]=useState('');
  useEffect(()=>{let cancelled=false;if(user?.storeId)getMeasureUnitsAction(user.storeId).then(list=>{if(!cancelled)setUnits(list);}).catch(()=>{if(!cancelled)setUnitError('Não foi possível carregar as unidades personalizadas.');});return()=>{cancelled=true;};},[user?.storeId]);
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: product?.id,
      name: product?.name ?? '',
      description: product?.description ?? '',
      brand: product?.brand ?? '',
      barcode: product?.barcode ?? '',
      category: product?.category,
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      minStock: product?.minStock ?? 0,
      unit: product?.unit ?? 'un',
      measurement:product?.measurement,
      supplier: product?.supplier??'',
      expiryDate: product?.expiryDate ? new Date(product.expiryDate) : null,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><Tabs defaultValue="product"><TabsList><TabsTrigger value="product">Produto</TabsTrigger><TabsTrigger value="conversion">Conversão (opcional)</TabsTrigger></TabsList><TabsContent value="product" forceMount className="data-[state=inactive]:hidden space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Arroz Integral 1kg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Descrição (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalhes do produto..." className="resize-none" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Nestlé" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de Barras (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Leia ou digite o código" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Alimentos">Alimentos</SelectItem>
                    <SelectItem value="Bebidas">Bebidas</SelectItem>
                    <SelectItem value="Limpeza">Limpeza</SelectItem>
                    <SelectItem value="Higiene">Higiene</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Preço de Venda (R$)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="7.50" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Estoque Inicial</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="120" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Estoque Mínimo</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="20" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
         <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidade</FormLabel>
              <FormControl>
                <select aria-label="Unidade de medida" className="h-10 w-full rounded border bg-background px-3" value={field.value} onChange={e=>{field.onChange(e.target.value);if(form.getValues('measurement'))form.setValue('measurement',units.find(u=>u.label===e.target.value)?.measurement);}}>{[...units,...(field.value&&!units.some(u=>u.label===field.value)?[{label:field.value}]:[])].map(u=><option key={u.label} value={u.label}>{u.label}</option>)}</select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor (opcional)</FormLabel>
              <Select onValueChange={v=>field.onChange(v==='__none__'?'':v)} value={field.value||'__none__'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={suppliers.length > 0 ? "Selecione um fornecedor" : "Cadastre um fornecedor"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">Sem fornecedor</SelectItem>{suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Validade (Opcional)</FormLabel>
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
                        <span>Selecione uma data</span>
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
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <details className="rounded border p-3"><summary>Cadastrar unidade de medida</summary><div className="mt-3 space-y-3"><label className="block text-sm">Nome<Input value={unitLabel} maxLength={40} placeholder="Ex.: Garrafa 2 L" onChange={e=>setUnitLabel(e.target.value)}/></label><label className="block text-sm">Quantidade equivalente por unidade (opcional)<Input type="number" min="0.000001" step="any" value={unitFactor} onChange={e=>setUnitFactor(e.target.value)}/></label><label className="block text-sm">Unidade equivalente<select className="ml-3 rounded border p-2" value={unitBase} onChange={e=>setUnitBase(e.target.value as typeof unitBase)}><option value="L">Litros</option><option value="kg">Quilogramas</option><option value="un">Unidades</option></select></label><Button type="button" disabled={savingUnit||!unitLabel.trim()} onClick={async()=>{if(!user?.storeId)return;setSavingUnit(true);setUnitError('');try{const measurement=unitFactor?{factor:Number(unitFactor),baseUnit:unitBase}:undefined;if(measurement&&(!Number.isFinite(measurement.factor)||measurement.factor<=0))throw new Error('Informe uma quantidade positiva.');const list=await createMeasureUnitAction(user.storeId,unitLabel,measurement);setUnits(list);form.setValue('unit',unitLabel.trim());if(form.getValues('measurement'))form.setValue('measurement',measurement);setUnitLabel('');setUnitFactor('');}catch{setUnitError('Não foi possível cadastrar. Confira o nome, a conversão e se a unidade já existe.');}finally{setSavingUnit(false);}}}>{savingUnit?'Cadastrando…':'Cadastrar e selecionar'}</Button>{unitError&&<p role="alert" className="text-sm text-destructive">{unitError}</p>}</div></details>
        </TabsContent><TabsContent value="conversion" forceMount className="data-[state=inactive]:hidden space-y-4"><p className="text-sm">A quantidade comercial continua sendo usada no estoque e no preço. A conversão informa o volume, peso ou número equivalente vendido.</p><label className="flex items-center gap-2"><input type="checkbox" checked={!!form.watch('measurement')} onChange={e=>form.setValue('measurement',e.target.checked?(units.find(u=>u.label===form.getValues('unit'))?.measurement??{factor:1,baseUnit:'un'}):undefined)}/>Ativar conversão deste produto</label>{form.watch('measurement')&&<><FormField control={form.control} name="measurement.factor" render={({field})=><FormItem><FormLabel>Quantidade equivalente por unidade comercial</FormLabel><FormControl><Input type="number" step="any" min="0.000001" {...field}/></FormControl><FormMessage/></FormItem>}/><FormField control={form.control} name="measurement.baseUnit" render={({field})=><FormItem><FormLabel>Converter para</FormLabel><FormControl><select className="h-10 w-full rounded border bg-background px-3" {...field}><option value="L">Litros (L)</option><option value="kg">Quilogramas (kg)</option><option value="un">Unidades (un)</option></select></FormControl><FormMessage/></FormItem>}/><p className="rounded bg-muted p-3">Exemplo: 3 × {form.watch('unit')} = {(3*Number(form.watch('measurement.factor')||0)).toLocaleString('pt-BR')} {form.watch('measurement.baseUnit')}. Cada venda guarda sua conversão para preservar o histórico.</p></>}</TabsContent></Tabs>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting?"Salvando…":"Salvar alterações"}</Button>
        </div>
      </form>
    </Form>
  );
}
