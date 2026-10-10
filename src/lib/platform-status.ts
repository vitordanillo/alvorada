import {prisma,withDbContext} from './db';
export class MaintenanceError extends Error {
 readonly code='MAINTENANCE';
 constructor(message:string){super(message||'Sistema em manutenção. Aguarde a liberação.');}
}
export async function readMaintenance(){
 return withDbContext({uid:'',platformAdmin:false},()=>prisma.platformMaintenance.findUniqueOrThrow({where:{id:'global'}}));
}
export async function assertPlatformAvailable(){
 const status=await readMaintenance();
 if(status.enabled)throw new MaintenanceError(status.message);
}
