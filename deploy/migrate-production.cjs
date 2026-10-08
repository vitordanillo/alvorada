require('dotenv').config({path:'.env.migrate',quiet:true});
const result=require('node:child_process').spawnSync(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy'],{stdio:'inherit',env:process.env});
process.exitCode=result.status;
