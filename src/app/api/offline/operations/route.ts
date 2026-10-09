import {NextRequest,NextResponse} from 'next/server';
import {currentUser} from '@/lib/auth';
import {submitOfflineOperationAction} from '@/lib/offline-operation-actions';
export const runtime='nodejs';
export async function POST(request:NextRequest){
  const origin=request.headers.get('origin');
  const expected=process.env.ALVORADA_PUBLIC_ORIGIN||'https://alvorada.firmaconecta.com';
  const allowed=new Set([expected,'https://alvorada.firmaconecta.com','http://151.243.24.208:3070']);
  if(process.env.NODE_ENV!=='production'){allowed.add('http://localhost:3000');allowed.add('http://127.0.0.1:3000');}
  if(!origin||!allowed.has(origin))return NextResponse.json({error:'Origem não autorizada.'},{status:403});
  if(request.headers.get('x-alvorada-protocol')!=='1')return NextResponse.json({error:'Atualize o aplicativo para sincronizar.'},{status:426});
  if(Number(request.headers.get('content-length')||0)>350000)return NextResponse.json({error:'Operação muito grande.'},{status:413});
  try{
    if(!await currentUser())return NextResponse.json({error:'Entre novamente para sincronizar. As pendências continuam salvas.'},{status:401});
    const body=await request.text();
    if(Buffer.byteLength(body)>350000)return NextResponse.json({error:'Operação muito grande.'},{status:413});
    let input;try{input=JSON.parse(body);}catch{return NextResponse.json({error:'Operação inválida.'},{status:400});}
    return NextResponse.json(await submitOfflineOperationAction(input),{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'Servidor indisponível. As operações continuam salvas.'},{status:503});}
}
