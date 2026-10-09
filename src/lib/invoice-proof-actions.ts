'use server';
import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {withAuthenticatedAction} from './auth';
import {prisma,withTransaction,currentDbUser} from './db';
export async function uploadInvoiceProofAction(form:FormData){
 return withAuthenticatedAction(async()=>{
 const invoiceId=String(form.get('invoiceId')??''),file=form.get('file');
 if(!/^[a-f0-9-]{36}$/.test(invoiceId)||!(file instanceof File)||file.size===0||file.size>5000000)throw new Error('Selecione PDF, JPG ou PNG de até 5 MB.');
 const bytes=Buffer.from(await file.arrayBuffer());const mime=bytes.subarray(0,5).toString()==='%PDF-'?'application/pdf':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':null;
 if(!mime)throw new Error('Formato do comprovante inválido.');
 await prisma.invoice.findUniqueOrThrow({where:{id:invoiceId}});
 const id=randomUUID(),dir=process.env.ALVORADA_PROOF_DIR||path.resolve(process.cwd(),'uploads','invoice-proofs');await mkdir(dir,{recursive:true});const full=path.join(dir,id);await writeFile(full,bytes,{flag:'wx'});
 try{await withTransaction(async tx=>{
 await tx.invoiceAttachment.create({data:{id,invoiceId,filename:file.name.replace(/[\r\n]/g,'').slice(0,180)||'comprovante',mimeType:mime,size:bytes.length,uploadedBy:currentDbUser()!.uid}});
 const invoice=await tx.invoice.findUniqueOrThrow({where:{id:invoiceId},include:{subscription:true}});
 await tx.platformAuditLog.create({data:{actorId:currentDbUser()!.uid,actorName:currentDbUser()!.name,action:'Anexar comprovante',details:'Cobrança '+invoiceId+'; arquivo '+id,targetStoreId:invoice.subscription.storeId}});
 });}catch(error){await unlink(full).catch(()=>{});throw error;}
 return {id};
 },'platform');
}
export async function getContractDetailAction(id:string){return withAuthenticatedAction(async()=>{
 if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Contrato inválido.');
 const contract=await prisma.subscription.findUniqueOrThrow({where:{id},include:{store:true,plan:true,invoices:{include:{attachments:true},orderBy:{dueDate:'desc'},take:100}}});
 const history=await prisma.platformAuditLog.findMany({where:{targetStoreId:contract.storeId},orderBy:{date:'desc'},take:100});
 return JSON.parse(JSON.stringify({contract,history}));
},'platform');}
