const path=require('node:path');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});
require('tsx/cjs');
const {prisma,withDbContext}=require('../src/lib/db.ts');
const {generateDueInvoices}=require('../src/lib/billing.ts');
let running=false;
async function tick(){
  if(running)return;
  running=true;
  try {
    await withDbContext({platformAdmin:true,uid:'',storeId:''},async()=>{
      const count=await generateDueInvoices();
      console.log(JSON.stringify({at:new Date().toISOString(),generated:count,status:'ok'}));
    });
  } catch(error){console.error(JSON.stringify({at:new Date().toISOString(),status:'failed',code:error.code||'billing_error'}));}
  finally{running=false;}
}
void tick();setInterval(tick,60*60*1000);
process.on('SIGINT',()=>{void prisma.$disconnect().finally(()=>process.exit(0));});
