'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/app-context';
import { createStoreAction, getPlatformDataAction, grantStoreAccessAction, selectStoreAction, updateStoreStatusAction } from '@/lib/platform-actions';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type PlatformData=Awaited<ReturnType<typeof getPlatformDataAction>>;
export default function PlatformPage() {
  const { user,loadingAuth }=useAuth();
  const { toast }=useToast();
  const [data,setData]=useState<PlatformData|null>(null);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  const [createOpen,setCreateOpen]=useState(false);
  const [accessStore,setAccessStore]=useState<string|null>(null);
  const reload=async()=>{setData(await getPlatformDataAction());};
  useEffect(()=>{let active=true;if(user?.isPlatformAdmin)getPlatformDataAction().then(value=>{if(active)setData(value);}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'Falha ao carregar as lojas.');});return()=>{active=false;};},[user?.uid,user?.isPlatformAdmin]);
  if(loadingAuth) return <p>Carregando…</p>;
  if(!user?.isPlatformAdmin) return <PageHeader title="Acesso restrito" description="Esta área pertence à administração da Firma Conecta."/>;
  const perform=async(operation:()=>Promise<unknown>,message:string)=>{
    setPending(true);setError('');
    try {await operation();await reload();toast({title:message});return true;}
    catch(cause){const message=cause instanceof Error?cause.message:'Não foi possível concluir.';setError(message);toast({variant:'destructive',title:'Falha na operação',description:message});return false;}
    finally{setPending(false);}
  };
  const create=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();const form=event.currentTarget;const values=new FormData(form);
    const get=(key:string)=>String(values.get(key)??'');
    const done=await perform(()=>createStoreAction({name:get('name'),cnpj:get('cnpj'),address:get('address'),phone:get('phone'),organizationId:get('organizationId')||undefined,organizationName:get('organizationName')||undefined,adminName:get('adminName'),adminEmail:get('adminEmail'),adminPassword:get('adminPassword')}),'Loja criada com seu administrador');
    if(done){form.reset();setCreateOpen(false);}
  };
  const grant=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();const values=new FormData(event.currentTarget);
    if(accessStore && await perform(()=>grantStoreAccessAction(accessStore,String(values.get('email')),String(values.get('role'))),'Acesso à loja atualizado'))setAccessStore(null);
  };
  return <div className="space-y-6">
    <PageHeader title="Lojas do Alvorada" description="Firma Conecta · administração da plataforma"><Button onClick={()=>setCreateOpen(!createOpen)} disabled={pending}>{createOpen?'Fechar cadastro':'Criar loja'}</Button></PageHeader>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {createOpen && <Card><CardHeader><CardTitle>Nova loja</CardTitle><CardDescription>A loja começa sem produtos, vendas ou clientes. O administrador recebe apenas acesso a ela.</CardDescription></CardHeader><CardContent>
      <form onSubmit={create} className="grid gap-4 md:grid-cols-2">
        <div><Label htmlFor="new-store-name">Nome da loja</Label><Input id="new-store-name" name="name" required minLength={2} maxLength={120}/></div>
        <div><Label htmlFor="new-store-cnpj">CNPJ</Label><Input id="new-store-cnpj" name="cnpj" maxLength={30}/></div>
        <div><Label htmlFor="new-store-address">Endereço</Label><Input id="new-store-address" name="address" maxLength={300}/></div>
        <div><Label htmlFor="new-store-phone">Telefone</Label><Input id="new-store-phone" name="phone" maxLength={30}/></div>
        <div><Label htmlFor="organization-id">Empresa cliente existente</Label><select id="organization-id" name="organizationId" className="h-10 w-full rounded-md border bg-background px-3"><option value="">Criar uma empresa cliente</option>{data?.organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
        <div><Label htmlFor="organization-name">Nome da nova empresa cliente</Label><Input id="organization-name" name="organizationName" placeholder="Usa o nome da loja se ficar vazio" maxLength={120}/></div>
        <div><Label htmlFor="admin-name">Nome do administrador da loja</Label><Input id="admin-name" name="adminName" required minLength={2} maxLength={120}/></div>
        <div><Label htmlFor="admin-email">E-mail do administrador</Label><Input id="admin-email" name="adminEmail" type="email" required autoComplete="off"/></div>
        <div><Label htmlFor="admin-password">Senha inicial do administrador</Label><Input id="admin-password" name="adminPassword" type="password" minLength={12} autoComplete="new-password"/><p className="mt-1 text-xs text-muted-foreground">Para uma conta nova: mínimo de 12 caracteres. Deixe vazio para vincular uma conta existente, mantendo a senha atual.</p></div>
        <div className="flex items-end"><Button type="submit" disabled={pending}>{pending?'Criando…':'Criar loja e administrador'}</Button></div>
      </form>
    </CardContent></Card>}
    {!data && !error && <p>Carregando lojas…</p>}
    <div className="grid gap-4 xl:grid-cols-2">{data?.stores.map(store=><Card key={store.id}><CardHeader><div className="flex items-center justify-between gap-2"><CardTitle>{store.name}</CardTitle><span className={store.status==='Ativa'?'text-sm text-green-700':'text-sm text-destructive'}>{store.status}</span></div><CardDescription>{store.organizationName}</CardDescription></CardHeader><CardContent className="space-y-3">
      <p className="break-all text-xs text-muted-foreground">ID: {store.id}</p>
      {store.cnpj && <p className="text-sm">CNPJ: {store.cnpj}</p>}
      <p className="text-sm">Administradores: {store.administrators.map(a=>a.email).join(', ')||'Nenhum'}</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending||store.status!=='Ativa'} onClick={()=>perform(async()=>{await selectStoreAction(store.id);window.location.assign('/dashboard');},'Loja selecionada')}>Acessar loja</Button>
        <Button variant="outline" disabled={pending} onClick={()=>setAccessStore(accessStore===store.id?null:store.id)}>Vincular usuário</Button>
        <Button variant="outline" disabled={pending} onClick={()=>perform(()=>updateStoreStatusAction(store.id,store.status==='Ativa'?'Suspensa':'Ativa'),'Status da loja atualizado')}>{store.status==='Ativa'?'Suspender':'Reativar'}</Button>
      </div>
      {accessStore===store.id && <form onSubmit={grant} className="space-y-3 rounded-md border p-3"><Label htmlFor={`email-${store.id}`}>E-mail de uma conta existente</Label><Input id={`email-${store.id}`} name="email" type="email" required/><Label htmlFor={`role-${store.id}`}>Cargo nesta loja</Label><select id={`role-${store.id}`} name="role" className="h-10 w-full rounded-md border bg-background px-3">{['Administrador','Gerente','Operador de Caixa','Estoquista'].map(role=><option key={role}>{role}</option>)}</select><Button type="submit" disabled={pending}>Salvar acesso</Button></form>}
    </CardContent></Card>)}</div>
    {data && <Card><CardHeader><CardTitle>Atividades da plataforma</CardTitle></CardHeader><CardContent>{data.logs.length===0?<p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>:<ul className="space-y-3">{data.logs.map(log=><li key={log.id} className="border-b pb-3 text-sm"><p className="font-medium">{log.action} · {log.actorName}</p><p>{log.details}</p><p className="text-xs text-muted-foreground">{new Date(log.date).toLocaleString('pt-BR')}</p></li>)}</ul>}</CardContent></Card>}
  </div>;
}
