'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { updateStoreDetailsAction } from '@/lib/platform-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function StoreDetailsCard() {
  const { user, reloadUser }=useAppContext();
  const store=user?.store;
  const { toast }=useToast();
  const [pending,setPending]=useState(false);
  if(!store) return null;
  const save=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    setPending(true);
    try {
      await updateStoreDetailsAction({name:String(data.get('name')),cnpj:String(data.get('cnpj')),address:String(data.get('address')),phone:String(data.get('phone'))},store.id);
      await reloadUser();
      toast({title:'Dados da loja atualizados'});
    } catch(error) {toast({variant:'destructive',title:'Falha ao salvar',description:error instanceof Error?error.message:'Tente novamente.'});}
    finally {setPending(false);}
  };
  return <Card><CardHeader><CardTitle>Identificação da loja</CardTitle><CardDescription>Estes dados aparecem nos novos comprovantes. Os comprovantes já emitidos mantêm seus dados.</CardDescription></CardHeader>
    <CardContent><p className="mb-4 break-all text-xs text-muted-foreground">ID: {store.id}</p>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" key={store.id}>
        <div><Label htmlFor="store-name">Nome da loja</Label><Input id="store-name" name="name" defaultValue={store.name} required minLength={2} maxLength={120}/></div>
        <div><Label htmlFor="store-cnpj">CNPJ</Label><Input id="store-cnpj" name="cnpj" defaultValue={store.cnpj} maxLength={30}/></div>
        <div><Label htmlFor="store-address">Endereço</Label><Input id="store-address" name="address" defaultValue={store.address} maxLength={300}/></div>
        <div><Label htmlFor="store-phone">Telefone</Label><Input id="store-phone" name="phone" defaultValue={store.phone} maxLength={30}/></div>
        <Button type="submit" disabled={pending} className="sm:col-span-2 sm:justify-self-start">{pending?'Salvando…':'Salvar dados da loja'}</Button>
      </form>
    </CardContent></Card>;
}
