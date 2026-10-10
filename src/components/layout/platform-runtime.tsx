'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useAppContext} from '@/context/app-context';
import {refreshPlatformStatus,savedPlatformStatus,type PlatformStatus} from '@/lib/platform-status-client';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Logo} from '@/components/icons/logo';
export function PlatformRuntime({children}:{children:React.ReactNode}){
 const {user,logout}=useAppContext();
 const [status,setStatus]=useState<PlatformStatus|null>(null),[open,setOpen]=useState(false),[dismissed,setDismissed]=useState(''),[checking,setChecking]=useState(false),[error,setError]=useState('');
 const active=useRef(false),fetching=useRef(false);
 const blockDialog=useRef<HTMLDialogElement>(null);
 const refresh=useCallback(async()=>{
  if(fetching.current)return;fetching.current=true;setChecking(true);
  try{const next=await refreshPlatformStatus();if(active.current){setStatus(next);setError('');}}
  catch{if(active.current)setError('Não foi possível consultar a liberação. Tente novamente ao conectar.');}
  finally{fetching.current=false;if(active.current)setChecking(false);}
 },[]);
 useEffect(()=>{
  active.current=true;setStatus(savedPlatformStatus());void refresh();
  const update=(e:Event)=>setStatus((e as CustomEvent<PlatformStatus>).detail);
  const stored=()=>setStatus(savedPlatformStatus());
  const focus=()=>{if(document.visibilityState==='visible')void refresh();};
  const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},15000);
  window.addEventListener('granzoti-platform-status',update);window.addEventListener('storage',stored);window.addEventListener('online',refresh);window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);
  return()=>{active.current=false;clearInterval(timer);window.removeEventListener('granzoti-platform-status',update);window.removeEventListener('storage',stored);window.removeEventListener('online',refresh);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);};
 },[refresh,user?.uid]);
 const blocked=!!user&&!user.isPlatformAdmin&&!!status?.maintenance.enabled;
 useEffect(()=>{const dialog=blockDialog.current;if(blocked&&dialog&&!dialog.open)dialog.showModal();return()=>{if(dialog?.open)dialog.close();};},[blocked]);
 const latest=status?.messages[0];
 return <>
  <div inert={blocked?true:undefined} aria-hidden={blocked||undefined}>
   {!!user&&latest&&latest.id!==dismissed&&<div className="flex items-center justify-between gap-3 border-b bg-blue-50 px-6 py-2 text-sm text-blue-950"><span className="truncate"><strong>{latest.kind==='patchnotes'?'Atualização':'Aviso'}:</strong> {latest.title}</span><div className="flex shrink-0 gap-2"><Button size="sm" variant="ghost" onClick={()=>setOpen(true)}>Ver comunicados</Button><Button size="sm" variant="ghost" aria-label="Ocultar comunicado" onClick={()=>setDismissed(latest.id)}>×</Button></div></div>}
   {children}
  </div>
  {blocked&&<dialog ref={blockDialog} onCancel={e=>e.preventDefault()} className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none items-center justify-center overflow-auto bg-slate-50 p-6 open:flex backdrop:bg-slate-50" role="alertdialog" aria-modal="true" aria-labelledby="maintenance-title" aria-describedby="maintenance-description"><section className="w-full max-w-xl rounded-2xl border bg-white p-8 shadow-sm"><Logo className="mb-5 h-14 w-14"/><p className="text-sm text-muted-foreground">Granzoti Sistemas</p><h1 id="maintenance-title" className="mt-2 text-2xl font-semibold">Sistema em manutenção</h1><p id="maintenance-description" className="mt-4 whitespace-pre-wrap">{status?.maintenance.message}</p>{status?.maintenance.expectedReturn&&<p className="mt-4 text-sm text-muted-foreground">Previsão de retorno: {new Date(status.maintenance.expectedReturn).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} (horário de Brasília).</p>}<p className="mt-4 text-sm text-muted-foreground">Seus dados e operações pendentes permanecem guardados. O acesso voltará após a liberação.</p>{error&&<p role="status" className="mt-4 text-sm">{error}</p>}<div className="mt-6 flex flex-wrap gap-3"><Button autoFocus disabled={checking} onClick={()=>void refresh()}>{checking?'Consultando…':'Verificar liberação'}</Button><Button variant="outline" onClick={()=>void logout()}>Sair</Button></div></section></dialog>}
  <Dialog open={open&&!blocked} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Avisos e atualizações</DialogTitle><DialogDescription>Comunicados da Granzoti Sistemas para sua empresa.</DialogDescription></DialogHeader>{status?.messages.map(message=><article className="rounded-xl border p-4" key={message.id}><p className="text-xs text-muted-foreground">{message.kind==='patchnotes'?'Notas de atualização':'Aviso'}{message.version?' · '+message.version:''} · {new Date(message.publishedAt).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})}</p><h2 className="mt-2 font-semibold">{message.title}</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm">{message.body}</p></article>)}</DialogContent></Dialog>
 </>;
}
