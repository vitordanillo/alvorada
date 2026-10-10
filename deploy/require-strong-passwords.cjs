'use strict';
const path=require('node:path'),bcrypt=require('bcryptjs');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});
require('dotenv').config({path:path.resolve(__dirname,'../.env.migrate'),quiet:true,override:true});
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient({datasourceUrl:process.env.DIRECT_DATABASE_URL||process.env.DATABASE_URL,log:[]});
async function main(){
 const role=await db.$queryRaw`SELECT current_user AS role`;
 if(role[0].role!=='alvorada_app')throw new Error('Requires the migration owner role.');
 const users=await db.user.findMany({where:{disabled:false},select:{uid:true,passwordHash:true,mustChangePassword:true,sessionVersion:true}});
 const weak=[];
 for(const user of users){for(const value of ['12345678','123456','password','admin','123456789','1234567890','qwerty'])if(await bcrypt.compare(value,user.passwordHash)){weak.push(user);break;}}
 let changed=0;
 if(process.argv.includes('--apply'))await db.$transaction(async tx=>{
  for(const user of weak.filter(user=>!user.mustChangePassword)){
   const result=await tx.user.updateMany({where:{uid:user.uid,passwordHash:user.passwordHash,sessionVersion:user.sessionVersion},data:{mustChangePassword:true,sessionVersion:{increment:1}}});
   changed+=result.count;
  }
 });
 console.log(JSON.stringify({accountsChecked:users.length,weakAccounts:weak.length,requiredPasswordChanges:changed,applied:process.argv.includes('--apply')}));
}
main().catch(error=>{console.error('Password review failed:',error.code||error.message);process.exitCode=1;}).finally(()=>db.$disconnect());
