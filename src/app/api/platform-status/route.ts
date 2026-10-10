import {NextResponse} from 'next/server';
import {currentUser} from '@/lib/auth';
import {prisma,withDbContext} from '@/lib/db';
import {readMaintenance} from '@/lib/platform-status';
import {createHash} from 'node:crypto';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{
  const maintenance=await readMaintenance(),user=await currentUser();
  const messages=user?await withDbContext({uid:user.uid,platformAdmin:false},()=>prisma.platformMessage.findMany({where:{publishedAt:{not:null},archived:false},select:{id:true,kind:true,title:true,body:true,version:true,publishedAt:true},orderBy:{publishedAt:'desc'},take:30})):[];
  const payload={maintenance:{enabled:maintenance.enabled,message:maintenance.message,expectedReturn:maintenance.expectedReturn,revision:maintenance.revision},messages};
  const etag='"'+createHash('sha256').update(JSON.stringify(payload)).digest('base64url')+'"';
  const headers={'Cache-Control':'no-store',ETag:etag,Vary:'Cookie'};
  if(request.headers.get('if-none-match')===etag)return new NextResponse(null,{status:304,headers});
  return NextResponse.json(payload,{headers});
 }catch{return NextResponse.json({error:'Situação temporariamente indisponível.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
