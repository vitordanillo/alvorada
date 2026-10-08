'use client';

import { useState } from 'react';
import { useAuth } from '@/context/app-context';
import { selectStoreAction } from '@/lib/platform-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export function StoreSelector() {
  const { user }=useAuth();
  const { toast }=useToast();
  const [pending,setPending]=useState(false);
  const stores=(user?.stores ?? []).filter(s=>s.status==='Ativa');
  if(user?.store && !stores.some(s=>s.id===user.storeId)) stores.push({...user.store,role:user.role});
  if(!user?.storeId) return <span className="text-sm text-muted-foreground">Administração da plataforma</span>;
  if(stores.length<2) return <span className="truncate text-sm font-medium">{user.store?.name}</span>;
  const change=async(id:string)=>{
    if(id===user.storeId) return;
    setPending(true);
    try { await selectStoreAction(id); window.location.assign('/dashboard'); }
    catch(error) { toast({variant:'destructive',title:'Não foi possível trocar a loja',description:error instanceof Error?error.message:'Tente novamente.'});setPending(false); }
  };
  return <Select value={user.storeId} onValueChange={change} disabled={pending}>
    <SelectTrigger className="w-[230px]" aria-label="Loja ativa"><SelectValue /></SelectTrigger>
    <SelectContent>{stores.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
  </Select>;
}
