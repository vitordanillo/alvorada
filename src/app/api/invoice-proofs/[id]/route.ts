import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {currentUser,withAuthenticatedAction} from '@/lib/auth';
import {prisma} from '@/lib/db';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const user=await currentUser(),{id}=await params;if(!user?.isPlatformAdmin||!/^[a-f0-9-]{36}$/.test(id))return new Response(null,{status:404});
 try{const proof=await withAuthenticatedAction(()=>prisma.invoiceAttachment.findUnique({where:{id}}),'platform');if(!proof)return new Response(null,{status:404});const bytes=await readFile(path.join(process.env.ALVORADA_PROOF_DIR||path.resolve(process.cwd(),'uploads','invoice-proofs'),id));return new Response(bytes,{headers:{'Content-Type':proof.mimeType,'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(proof.filename),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});}catch{return new Response(null,{status:404});}
}
