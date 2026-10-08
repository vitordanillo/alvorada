// Password is read from stdin and is never persisted or printed.
const path=require('node:path');
const readline=require('node:readline');
const bcrypt=require('bcryptjs');
const {randomUUID}=require('node:crypto');
require('dotenv').config({path:path.resolve(__dirname,'../.env.migrate'),quiet:true});
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient({datasourceUrl:process.env.DIRECT_DATABASE_URL,log:[]});
async function main(){
  if(process.argv[2]==='finalize') {
    await db.$transaction(async tx=>{
      const admin=await tx.user.findUniqueOrThrow({where:{email:'admin@firmaconecta.com'}});
      if(!admin.isPlatformAdmin||admin.disabled||admin.storeId)throw Error('New global administrator not ready.');
      const vitor=await tx.user.findUniqueOrThrow({where:{email:'vitor@firmaconecta.com'}});
      await tx.user.update({where:{uid:vitor.uid},data:{isPlatformAdmin:false,sessionVersion:{increment:1}}});
      await tx.platformAuditLog.create({data:{action:'Transferir administração global',details:'Conta admin@firmaconecta.com assume a administração. Vitor mantém seus vínculos de loja e perde o privilégio global; sessões anteriores revogadas.',actorId:admin.uid,actorName:admin.name}});
    });
    console.log('Global admin transferred; store memberships preserved.');return;
  }
  console.log('Informe a senha inicial:');
  const rl=readline.createInterface({input:process.stdin,output:process.stdout,terminal:false});
  const password=await new Promise(resolve=>rl.once('line',resolve));rl.close();
  if(password.length<12||Buffer.byteLength(password)>72)throw Error('Password length invalid.');
  const passwordHash=await bcrypt.hash(password,12);
  await db.$transaction(async tx=>{
    if(await tx.user.findUnique({where:{email:'admin@firmaconecta.com'}}))throw Error('Global account already exists; refusing to overwrite.');
    const admin=await tx.user.create({data:{uid:randomUUID(),name:'Administrador Firma Conecta',email:'admin@firmaconecta.com',passwordHash,role:'Administrador',isPlatformAdmin:true,storeId:null}});
    await tx.platformAuditLog.create({data:{action:'Criar administração global',details:'Conta exclusiva da plataforma, sem vínculo operacional com lojas.',actorId:admin.uid,actorName:admin.name}});
  });
  const created=await db.user.findUniqueOrThrow({where:{email:'admin@firmaconecta.com'}});
  if(!await bcrypt.compare(password,created.passwordHash))throw Error('Credential verification failed.');
  console.log('Global account created and password verified.');
}
main().catch(error=>{console.error(error.code||error.message);process.exitCode=1;}).finally(()=>db.$disconnect());
