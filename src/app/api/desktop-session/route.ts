import {desktopSessionIdentity} from '@/lib/auth';
export const runtime='nodejs';
export async function GET(){
 const identity=await desktopSessionIdentity();
 return Response.json(identity??{error:'Entre novamente para preparar este dispositivo.'},{status:identity?200:401,headers:{'Cache-Control':'private, no-store'}});
}
