'use client';
import {useEffect,useState} from 'react';
import {usePathname,useSearchParams,useRouter} from 'next/navigation';
import {useAppContext} from '@/context/app-context';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
export function DataNavigation(){
 const {dataPage,loading}=useAppContext(),pathname=usePathname(),params=useSearchParams(),router=useRouter();const [search,setSearch]=useState(params.get('search')??''),[from,setFrom]=useState(params.get('from')??''),[to,setTo]=useState(params.get('to')??'');
 useEffect(()=>{setSearch(params.get('search')??'');setFrom(params.get('from')??'');setTo(params.get('to')??'');},[pathname,params]);
 const go=(page:number)=>{const next=new URLSearchParams(params.toString());next.set('page',String(page));for(const [key,value] of [['search',search],['from',from],['to',to]])value?next.set(key,value):next.delete(key);router.push(pathname+'?'+next.toString());};
 if(!dataPage.main)return null;const busy=Object.values(loading).some(Boolean);
 return <div className="mb-5 space-y-2 rounded border bg-background p-3"><form className="flex flex-wrap items-end gap-2" onSubmit={e=>{e.preventDefault();go(1);}}><Input className="w-64" aria-label="Pesquisar em todos os registros" value={search} placeholder="Pesquisar todos os registros…" onChange={e=>setSearch(e.target.value)}/>{dataPage.main==='sales'&&<><label className="text-xs">De<Input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label className="text-xs">Até<Input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></>}<Button type="submit" disabled={busy}>Filtrar no servidor</Button></form><div className="flex flex-wrap items-center gap-3 text-sm"><span>{dataPage.total} registro(s) · página {dataPage.page} de {Math.max(1,Math.ceil(dataPage.total/dataPage.pageSize))}</span><Button size="sm" variant="outline" disabled={busy||dataPage.page<=1} onClick={()=>go(dataPage.page-1)}>Anterior</Button><Button size="sm" variant="outline" disabled={busy||dataPage.page*dataPage.pageSize>=dataPage.total} onClick={()=>go(dataPage.page+1)}>Próxima</Button><span className="text-muted-foreground">Filtros desta página abaixo refinam os {dataPage.pageSize} registros carregados.</span></div>{dataPage.total===0&&<p>Nenhum registro corresponde à pesquisa.</p>}</div>;
}
