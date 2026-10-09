import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { withAuthenticatedAction } from '@/lib/auth';
import { prisma, currentDbUser, withDbContext } from '@/lib/db';

export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{uid:string;file:string}>}){
  const {uid,file}=await params;
  if(!/^[a-f0-9-]{36}$/.test(uid)||!/^[a-f0-9-]{36}\.webp$/.test(file))return new Response(null,{status:404});
  try{
    return await withAuthenticatedAction(async()=>{
      const user=currentDbUser()!;
      const record=await withDbContext({platformAdmin:!!user.isPlatformAdmin},()=>prisma.user.findUnique({where:{uid},select:{avatarUrl:true}}));
      if(record?.avatarUrl!==`/api/avatars/${uid}/${file}`)return new Response(null,{status:404});
      const data=await readFile(path.join(process.env.ALVORADA_AVATAR_DIR || path.resolve(process.cwd(),'uploads','avatars'),uid,file));
      return new Response(new Uint8Array(data),{headers:{'Content-Type':'image/webp','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
    },'identity');
  }catch{return new Response(null,{status:404});}
}
