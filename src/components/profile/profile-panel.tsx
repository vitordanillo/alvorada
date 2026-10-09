'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ArrowLeft, Loader2, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/context/app-context';
import { getProfileAction, updateProfileAction, changeOwnPasswordAction, revokeOtherSessionsAction } from '@/lib/profile-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Profile=Awaited<ReturnType<typeof getProfileAction>>;
async function preparePhoto(file:File):Promise<string>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Escolha uma imagem JPG, PNG ou WebP de até 5 MB.');
  const image=await createImageBitmap(file);
  try{
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Não foi possível preparar a foto.');
    const side=Math.min(image.width,image.height);ctx.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,256,256);
    return canvas.toDataURL('image/webp',0.85);
  }finally{image.close();}
}

export function ProfilePanel({initialProfile}:{initialProfile:Profile}){
  const {reloadUser,user}=useAuth();
  const [profile,setProfile]=useState(initialProfile);
  const [name,setName]=useState(initialProfile.name);
  const [photo,setPhoto]=useState<string>();
  const [removePhoto,setRemovePhoto]=useState(false);
  const [preparing,setPreparing]=useState(false);
  const [pending,setPending]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [sessionPassword,setSessionPassword]=useState('');
  const busy=!!pending || preparing;
  const back=profile.isPlatformAdmin?'/admin':'/dashboard';
  async function run(task:string,operation:()=>Promise<void>){
    if(busy)return;setPending(task);setError('');setMessage('');
    try{await operation();}catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir. Tente novamente.');}finally{setPending('');}
  }
  function save(event:FormEvent){event.preventDefault();void run('profile',async()=>{
    const result=await updateProfileAction({name,photo,removePhoto});if(!result.ok)throw new Error(result.error);
    const latest=await getProfileAction();setProfile(latest);setName(latest.name);setPhoto(undefined);setRemovePhoto(false);
    await reloadUser();setMessage('Perfil atualizado com sucesso.');
  });}
  function password(event:FormEvent){event.preventDefault();void run('password',async()=>{
    const result=await changeOwnPasswordAction({currentPassword,newPassword,confirmation});if(!result.ok)throw new Error(result.error);
    setCurrentPassword('');setNewPassword('');setConfirmation('');await reloadUser();
    setMessage('Senha alterada. As outras sessões foram encerradas; você continua conectado.');
  });}
  function sessions(event:FormEvent){event.preventDefault();void run('sessions',async()=>{
    const result=await revokeOtherSessionsAction(sessionPassword);if(!result.ok)throw new Error(result.error);setSessionPassword('');await reloadUser();
    setMessage('Outras sessões encerradas. Você continua conectado neste navegador.');
  });}
  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href={back} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950"><ArrowLeft size={16}/> {profile.isPlatformAdmin?'Voltar à administração':'Voltar à loja'}</Link>
      <header className="flex items-center gap-4"><div className="rounded-2xl bg-blue-950 p-3 text-white"><UserRound size={26}/></div><div><h1 className="text-3xl font-semibold tracking-tight">Meu perfil</h1><p className="text-sm text-muted-foreground">Seus dados pessoais, acessos e segurança.</p></div></header>
      {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">{message}</p>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Dados pessoais</CardTitle><CardDescription>Seu nome e foto aparecem nos menus e nas ações que você registra.</CardDescription></CardHeader><CardContent>
            <form onSubmit={save} className="space-y-5">
              <div className="flex flex-wrap items-center gap-4"><Avatar className="h-20 w-20"><AvatarImage src={photo || (!removePhoto?profile.avatarUrl??undefined:undefined)} alt="Foto do perfil"/><AvatarFallback className="text-xl">{name.trim().charAt(0).toUpperCase()||'U'}</AvatarFallback></Avatar><div className="flex-1 space-y-2"><Label htmlFor="profile-photo">Foto do perfil</Label><Input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;setPreparing(true);setError('');try{setPhoto(await preparePhoto(file));setRemovePhoto(false);}catch(e){setError(e instanceof Error?e.message:'Não foi possível ler a foto.');}finally{setPreparing(false);}}}/><p className="text-xs text-muted-foreground">JPG, PNG ou WebP, até 5 MB. A foto será recortada em formato quadrado.</p><Button type="button" variant="ghost" size="sm" disabled={busy||(!photo&&!profile.avatarUrl)} onClick={()=>{setPhoto(undefined);setRemovePhoto(true);}}>Remover foto</Button></div></div>
              <div className="space-y-2"><Label htmlFor="profile-name">Nome</Label><Input id="profile-name" autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} disabled={busy}/></div>
              <div className="space-y-2"><Label htmlFor="profile-email">E-mail</Label><Input id="profile-email" type="email" value={profile.email} readOnly/><p className="text-xs text-muted-foreground">Para alterar o e-mail ou suas permissões, fale com a administração.</p></div>
              <Button type="submit" disabled={busy}>{pending==='profile'&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Salvar perfil</Button>
            </form>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Acessos da conta</CardTitle><CardDescription>Permissões definidas pela administração.</CardDescription></CardHeader><CardContent className="space-y-3">
            {profile.isPlatformAdmin?<div className="rounded-lg bg-blue-50 p-4 text-blue-950"><p className="flex items-center gap-2 font-medium"><ShieldCheck size={18}/>Administrador da plataforma</p><p className="mt-1 text-sm">Acesso global à Firma Conecta, independente de uma loja.</p></div>:profile.stores.map(store=><div key={store.id} className="rounded-lg border p-3"><p className="font-medium">{store.name}</p><p className="text-sm text-muted-foreground">{store.role} · {store.status}</p></div>)}
            {user?.isPlatformAdmin&&user.storeId&&<p className="text-sm text-muted-foreground">Você está em suporte na loja {user.store?.name}. Alterações neste perfil pertencem à sua conta global.</p>}
            <p className="text-xs text-muted-foreground">Conta criada em {new Date(profile.createdAt).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})}.</p>
          </CardContent></Card>
        </div>
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Alterar minha senha</CardTitle><CardDescription>Confirme a senha atual. A mudança encerra as outras sessões.</CardDescription></CardHeader><CardContent><form onSubmit={password} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="current-password">Senha atual</Label><Input id="current-password" type="password" autoComplete="current-password" required maxLength={72} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} disabled={busy}/></div>
            <div className="space-y-2"><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={newPassword} onChange={e=>setNewPassword(e.target.value)} disabled={busy}/><p className="text-xs text-muted-foreground">Pelo menos 12 caracteres, com no máximo 72 bytes.</p></div>
            <div className="space-y-2"><Label htmlFor="confirm-password">Confirmar nova senha</Label><Input id="confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/></div>
            <Button type="submit" disabled={busy}>{pending==='password'&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Alterar senha</Button>
          </form></CardContent></Card>
          <Card><CardHeader><CardTitle>Outras sessões</CardTitle><CardDescription>Desconecte os outros navegadores e dispositivos. Eles precisarão entrar novamente na próxima requisição.</CardDescription></CardHeader><CardContent><form onSubmit={sessions} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="session-password">Confirme sua senha</Label><Input id="session-password" type="password" autoComplete="current-password" required maxLength={72} value={sessionPassword} onChange={e=>setSessionPassword(e.target.value)} disabled={busy}/></div>
            <Button type="submit" variant="outline" disabled={busy}>{pending==='sessions'&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Encerrar outras sessões</Button>
          </form></CardContent></Card>
        </div>
      </div>
    </div>
  </main>;
}
