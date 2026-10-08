const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
require('dotenv').config({path:path.join(root,'.env'),quiet:true});
require('dotenv').config({path:path.join(root,'.env.migrate'),quiet:true});
const runtime=new URL(process.env.DATABASE_URL),owner=new URL(process.env.DIRECT_DATABASE_URL);
runtime.searchParams.set('schema','alvorada_admin_20261008_test');owner.searchParams.set('schema','alvorada_admin_20261008_test');
const env={...process.env,TEST_DATABASE_URL:runtime.toString(),TEST_DIRECT_DATABASE_URL:owner.toString(),DATABASE_URL:runtime.toString(),DIRECT_DATABASE_URL:owner.toString()};
for(const args of [[path.join(root,'node_modules/prisma/build/index.js'),'migrate','deploy'],[path.join(root,'node_modules/tsx/dist/cli.mjs'),'scripts/test-admin.ts']]){
  const result=spawnSync(process.execPath,args,{cwd:root,env,stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
}
