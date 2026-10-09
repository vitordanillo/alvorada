'use client';
import {useEffect,useState} from 'react';
import {usePathname,useSearchParams,useRouter} from 'next/navigation';
import {useAppContext} from '@/context/app-context';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
export function DataNavigation(){
 const {dataPage,loading}=useAppContext(),pathname=usePathname(),params=useSearchParams(),router=useRouter();
 const [search,setSearch]=useState(params.get('search')??''),[from,setFrom]=useState(params.get('from')??''),[to,setTo]=useState(params.get('to')??'');
 useEffect(()=>{setSearch(params.get('search')??'');setFrom(params.get('from')??'');setTo(params.get('to')??'');},[pathname,params]);
 const go=(page:number)=>{const next=new URLSearchParams(params.toString());next.set('page',String(page));for(const [key,value] of [['search',search],['from',from],['to',to]])value?next.set(key,value):next.delete(key);router.push(pathname+'?'+next.toString());};
 if(!dataPage.main)return null;
 const busy=Object.values(loading).some(Boolean),pages=Math.max(1,Math.ceil(dataPage.total/dataPage.pageSize));
 const active=Boolean(params.get('search')||params.get('from')||params.get('to'));
 return <div className="mt-6 border-t pt-4">
  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span className="text-muted-foreground">{dataPage.total} registros{pages>1&&` · Página ${dataPage.page} de ${pages}`}</span>
   {pages>1&&<nav aria-label="Paginação" className="flex gap-2"><Button size="sm" variant="outline" disabled={busy||dataPage.page<=1} onClick={()=>go(dataPage.page-1)}>Anterior</Button><Button size="sm" variant="outline" disabled={busy||dataPage.page>=pages} onClick={()=>go(dataPage.page+1)}>Próxima</Button></nav>}
  </div>
  <details key={pathname} className="mt-3 text-sm">
   <summary className="w-fit cursor-pointer rounded py-1 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">Busca e filtros{active?' · aplicados':''}</summary>
   <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();go(1);}}>
    <label className="space-y-1">Pesquisar<Input className="w-full sm:w-64" value={search} placeholder="Buscar registros…" onChange={e=>setSearch(e.target.value)}/></label>
    {dataPage.main==='sales'&&<><label className="space-y-1">De<Input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label className="space-y-1">Até<Input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></>}
    <Button type="submit" variant="outline" disabled={busy}>Aplicar</Button>
    {active&&<Button type="button" variant="ghost" disabled={busy} onClick={()=>{const next=new URLSearchParams(params.toString());for(const key of ['search','from','to','page'])next.delete(key);router.push(pathname+(next.size?'?'+next.toString():''));}}>Limpar filtros</Button>}
   </form>
  </details>
 </div>;
}