const path=require('node:path');
require('dotenv').config({path:path.resolve(__dirname,'../.env.migrate'),quiet:true});
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient({datasourceUrl:process.env.DIRECT_DATABASE_URL,log:[]});
async function main(){
  const email=process.argv[2]?.trim().toLowerCase();
  if(!process.env.DIRECT_DATABASE_URL || !email) throw Error('Migration credential and existing administrator email required.');
  const user=await db.user.findUnique({where:{email}});
  if(!user || user.role!=='Administrador') throw Error('An existing store administrator is required.');
  await db.$transaction(async tx=>{
    await tx.user.update({where:{uid:user.uid},data:{isPlatformAdmin:true}});
    await tx.platformAuditLog.create({data:{action:'Habilitar administração da plataforma',details:`Conta proprietária habilitada para administrar o Alvorada da Firma Conecta.`,actorId:user.uid,actorName:user.name,targetStoreId:user.storeId}});
  });
  console.log(JSON.stringify({platformAdminEnabled:true,email}));
}
main().catch(error=>{console.error('Platform administrator provisioning failed:',error.code||error.message);process.exitCode=1;}).finally(()=>db.$disconnect());
