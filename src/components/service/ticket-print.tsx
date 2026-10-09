'use client';
import Barcode from 'react-barcode';
import type { Store } from '@/lib/types';
export type PrintableTicket={id:string;code:string;productName:string;status:string;unitIndex:number};
export function TicketPrint({tickets,store}:{tickets:PrintableTicket[];store:Store}) {
  return <div id="service-ticket-print" className="hidden" aria-hidden="true">{tickets.map(ticket=><div className="pickup-ticket" key={ticket.id}><h2 className="font-bold">{store.name}</h2><p>Ficha de retirada · 1 unidade</p><h3 className="my-2 text-lg font-bold">{ticket.productName}</h3>{ticket.status!=='Pendente'&&<p>JÁ UTILIZADA</p>}<Barcode value={ticket.code} width={1.1} height={35} fontSize={11} margin={0}/><p className="mt-2 text-xs">Apresente esta ficha na retirada.</p><p className="text-xs">Alvorada · Firma Conecta</p></div>)}</div>;
}
