'use client';
import {useEffect,useState,useRef} from 'react';
import {readOfflineUser} from '@/lib/offline-session';
import {getFromCache} from '@/lib/offline-db';
import {useAppContext} from '@/context/app-context';
const routes=['/dashboard','/pos','/dashboard/products','/dashboard/inventory','/dashboard/inventory/entry','/dashboard/inventory/adjustment','/dashboard/sales','/dashboard/customers','/dashboard/suppliers','/dashboard/accounts-payable','/dashboard/purchase-orders','/dashboard/purchase-orders/new','/dashboard/purchase-orders/edit','/dashboard/customers/detail','/dashboard/cash-register','/dashboard/reports','/dashboard/reports/sales','/dashboard/reports/products','/dashboard/reports/cash-flow'];
export function OfflineRuntime(){
 const {user,isOffline,offlineOperations}=useAppContext();const offlineRef=useRef(isOffline);offlineRef.current=isOffline;const [ready,setReady]=useState(false),[problem,setProblem]=useState('');
 useEffect(()=>{
  if(!user?.storeId)return;
  let cancelled=false;
  const prepare=async()=>{
   if(!window.isSecureContext||!('serviceWorker' in navigator)){setProblem('Abra pelo endereço HTTPS para preparar a reabertura sem internet.');return;}
   try{
    const registration=await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});
    await navigator.serviceWorker.ready;
    const worker=registration.active;if(!worker)return;
    const paths=user.role==='Operador de Caixa'?['/dashboard','/pos','/dashboard/cash-register']:user.role==='Estoquista'?routes.filter(p=>p==='/dashboard'||p.includes('products')||p.includes('inventory')||p.includes('purchase-orders')):[...routes];
    if(user.store?.enabledModules?.includes('mesas_fichas')&&user.role!=='Estoquista')paths.push('/dashboard/service');
    const channel=new MessageChannel();channel.port1.onmessage=async e=>{const snapshot=await getFromCache<any>(`${user.uid}:${user.storeId}`,'snapshot');if(!cancelled){setReady(!!e.data.ready&&!!snapshot&&!!readOfflineUser());setProblem(!e.data.assetsReady?'Não foi possível guardar todos os arquivos do aplicativo. Confira o armazenamento e reconecte.':e.data.prepared<e.data.total?'Algumas páginas ainda estão sendo preparadas.':'');}channel.port1.close();};
    worker.postMessage({type:'PREPARE',scope:`${user.uid}:${user.storeId}`,paths},[channel.port2]);
    await navigator.storage?.persist?.();
   }catch{if(!cancelled)setProblem('Não foi possível preparar o aplicativo neste navegador. As operações locais permanecem salvas.');}
  };
  void prepare();window.addEventListener('online',prepare);
  const navigate=(e:MouseEvent)=>{
   if((navigator.onLine&&!offlineRef.current)||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
   const link=(e.target as HTMLElement)?.closest('a[href]') as HTMLAnchorElement|null;
   if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
   const url=new URL(link.href);if(url.origin===location.origin&&(url.pathname.startsWith('/dashboard')||url.pathname==='/pos')){e.preventDefault();e.stopPropagation();location.assign(url.href);}
  };
  document.addEventListener('click',navigate,true);
  return()=>{cancelled=true;document.removeEventListener('click',navigate,true);window.removeEventListener('online',prepare);};
 },[user?.uid,user?.storeId,user?.role]);
 if(!user?.storeId)return null;
 return <div role="status" className={`border-b px-6 py-2 text-sm ${isOffline?'bg-amber-50 text-amber-900':'bg-background text-muted-foreground'}`}>{isOffline?'Sem conexão · Operações salvas neste dispositivo aguardam sincronização.':offlineOperations.length?${offlineOperations.length} operações locais aguardam confirmação.:ready?'Dispositivo preparado para operar offline.':problem||'Preparando este dispositivo para operar offline…'}</div>;
}
