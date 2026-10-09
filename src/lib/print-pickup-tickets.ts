'use client';

export function printPickupTickets() {
  const content=document.getElementById('service-ticket-print');
  if(!content)throw new Error('Prepare as fichas antes de imprimir.');
  const preview=window.open('','_blank','width=420,height=800');
  if(!preview)throw new Error('Permita a abertura da janela de impressão para este site.');
  preview.opener=null;
  preview.document.open();
  preview.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Fichas de retirada · Alvorada</title><style>
    body{width:72mm;margin:0 auto;background:white;color:black;font:12px 'Courier New',monospace}
    .pickup-ticket{break-inside:avoid;page-break-inside:avoid;border-bottom:1px dashed black;padding:5mm 0;text-align:center}
    h2,h3{margin:2mm 0}p{margin:1mm 0}svg{display:block;margin:2mm auto}.text-xs{font-size:10px}.font-bold{font-weight:bold}
    @page{margin:4mm}
  </style></head><body>${content.innerHTML}</body></html>`);
  preview.document.close();
  preview.requestAnimationFrame(()=>preview.requestAnimationFrame(()=>{
    preview.focus();preview.print();preview.close();
  }));
}
