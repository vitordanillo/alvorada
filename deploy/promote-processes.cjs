// Preserve PM2 process IDs while updating the resolved release paths.
// The normal ecosystem restart filters these internal path fields in PM2 6.
const fs=require('node:fs');
const path=require('node:path');
const deploymentRoot=path.resolve(__dirname,'../..');
const releaseRoot=path.resolve(process.argv[2]||path.resolve(__dirname,'..'));
const buildDir=process.argv[3]||'.next';
if(!releaseRoot.startsWith(deploymentRoot+path.sep)||!/^\.next(?:-[a-z0-9-]+)?$/.test(buildDir))throw new Error('Unexpected release directory');
if(!fs.existsSync(path.join(releaseRoot,buildDir,'BUILD_ID')))throw new Error('Release has no completed build');
process.env.PM2_HOME=path.join(deploymentRoot,'pm2');
const pm2=require(path.join(deploymentRoot,'runtime','pm2'));
const rpc=(method,args)=>new Promise((resolve,reject)=>pm2.Client.executeRemote(method,args,(error,result)=>error?reject(error):resolve(result)));
const targets=[{name:'alvorada-smart-market',file:'start-server.cjs'},{name:'alvorada-billing',file:'billing-worker.cjs'}];
async function healthy(){
  let detail='not reached';
  for(let i=0;i<30;i++){
    try{const r=await fetch('http://127.0.0.1:3070/api/health',{signal:AbortSignal.timeout(10000)});const j=await r.json();detail=`HTTP ${r.status}; status=${j.status}; database=${j.database}`;if(r.ok&&j.status==='ok'&&j.database==='connected')return;}catch(error){detail=error.cause?.code||error.name;}
    if(i===0||i%5===0)console.log('Waiting for release health: '+detail);
    await new Promise(resolve=>setTimeout(resolve,2000));
  }
  throw new Error('Release health check failed: '+detail);
}
async function main(){
  await new Promise((resolve,reject)=>pm2.connect(error=>error?reject(error):resolve()));
  const records=await rpc('getMonitorData',{});
  const previous=targets.map(t=>{
    const matches=records.filter(p=>p.name===t.name);
    if(matches.length!==1)throw new Error('Expected one existing process: '+t.name);
    const p=matches[0];
    if(!p.pm2_env.pm_cwd.startsWith(deploymentRoot+path.sep))throw new Error('Process is outside the deployment directory');
    return {target:t,record:p};
  });
  const backup=path.join(deploymentRoot,'backups','pm2-release-'+Date.now()+'.json');
  fs.writeFileSync(backup,JSON.stringify(previous),{flag:'wx',mode:0o600});
  try {
    for(const {target,record} of previous){
      const {current_conf:ignored,...env}=record.pm2_env.env||{};
      const runtimeEnv={...env,ALVORADA_BUILD_DIR:buildDir,ALVORADA_PROOF_DIR:path.join(deploymentRoot,'app-admin','uploads','invoice-proofs'),ALVORADA_AVATAR_DIR:path.join(deploymentRoot,'app-admin','uploads','avatars')};
      const script=path.join(releaseRoot,'deploy',target.file);
      await rpc('restartProcessId',{id:record.pm2_env.pm_id,env:{...runtimeEnv,current_conf:{pm_cwd:releaseRoot,pm_exec_path:script,cwd:releaseRoot,script,ALVORADA_BUILD_DIR:buildDir,env:runtimeEnv}}});
    }
    const running=await rpc('getMonitorData',{});
    const selected=targets.map(t=>running.find(p=>p.name===t.name));
    if(selected.some(p=>!p||p.pm2_env.pm_cwd!==releaseRoot||p.pm2_env.pm_exec_path!==path.join(releaseRoot,'deploy',targets.find(t=>t.name===p.name).file)))throw new Error('Resolved process paths were not updated');
    await healthy();
    console.log(JSON.stringify({status:'ok',backup,processes:selected.map(p=>({name:p.name,pid:p.pid,cwd:p.pm2_env.pm_cwd,script:p.pm2_env.pm_exec_path}))}));
  } catch(error){
    for(const {record} of previous)await rpc('restartProcessId',{id:record.pm2_env.pm_id,env:{...record.pm2_env.env,current_conf:record.pm2_env}});
    throw error;
  }
}
main().catch(error=>{console.error('Release update failed:',error.message);process.exitCode=1;}).finally(()=>pm2.disconnect());
