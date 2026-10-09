const assert=require('node:assert/strict');
const path=require('node:path');const fs=require('node:fs');
const {spawn,spawnSync}=require('node:child_process');
const {randomUUID}=require('node:crypto');const bcrypt=require('bcryptjs');
const {PrismaClient}=require('@prisma/client');
const root=path.resolve(__dirname,'..');
require('dotenv').config({path:path.join(root,'.env'),quiet:true});
require('dotenv').config({path:path.join(root,'.env.migrate'),quiet:true});
const target='alvorada_profile_20261009_test';
const runtime=new URL(process.env.DATABASE_URL),ownerUrl=new URL(process.env.DIRECT_DATABASE_URL);
runtime.searchParams.set('schema',target);ownerUrl.searchParams.set('schema',target);
const env={...process.env,DATABASE_URL:runtime.toString(),DIRECT_DATABASE_URL:ownerUrl.toString(),ALVORADA_BUILD_DIR:'.next-profile',ALVORADA_HOST:'127.0.0.1',ALVORADA_PORT:'3072',AUTH_COOKIE_SECURE:'false',ALVORADA_AVATAR_DIR:path.join(root,'uploads','profile-test')};
const owner=new PrismaClient({datasourceUrl:ownerUrl.toString(),log:[]});
const db=new PrismaClient({datasourceUrl:runtime.toString(),log:[]});
const base='http://127.0.0.1:3072';let server;
const password='DisposableProfile123!';const nextPassword='NewDisposableProfile456!';
let pass=0;function check(label){pass++;console.log('PASS '+label)}
async function sources(html){return (await Promise.all([...html.matchAll(/src="([^"\s]+\.js)"/g)].map(async m=>fetch(base+m[1]).then(r=>r.text())))).join('\n')}
function actionId(js,name){const match=js.match(new RegExp('createServerReference\\)\\("([a-f0-9]+)"[^;]{0,120}?"'+name+'"'));if(!match)throw Error('Action not found: '+name);return match[1]}
async function action(id,args,cookie,url='/profile'){
 const response=await fetch(base+url,{method:'POST',headers:{'Next-Action':id,'Content-Type':'text/plain;charset=UTF-8',Origin:base,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(args)});
 const text=await response.text();const row=text.match(/^1:(.*)$/m);
 if(!row||row[1].startsWith('E'))throw Error('Action rejected');
 const value=JSON.parse(row[1]);if(value?.ok===false)throw Error(value.error);
 return {value:value?.ok===true?value.data:value,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
async function main(){
 try{
  const migration=spawnSync(process.execPath,[path.join(root,'node_modules/prisma/build/index.js'),'migrate','deploy'],{cwd:root,env,stdio:'inherit'});
  if(migration.status!==0)throw Error('Test migration failed');
  const org=await owner.organization.create({data:{name:'Disposable profile test'}});
  const store=await owner.store.create({data:{name:'Loja de teste Perfil',organizationId:org.id}});
  const otherStore=await owner.store.create({data:{name:'Outra loja de teste',organizationId:org.id}});
  const hash=await bcrypt.hash(password,12);
  const operator=await owner.user.create({data:{uid:randomUUID(),name:'Operador Perfil',email:'profile-operator@test.invalid',role:'Operador de Caixa',storeId:store.id,passwordHash:hash,memberships:{create:{storeId:store.id,role:'Operador de Caixa'}}}});
  const other=await owner.user.create({data:{uid:randomUUID(),name:'Outro operador',email:'other-operator@test.invalid',role:'Operador de Caixa',storeId:otherStore.id,passwordHash:hash,memberships:{create:{storeId:otherStore.id,role:'Operador de Caixa'}}}});
  const global=await owner.user.create({data:{uid:randomUUID(),name:'Global Perfil',email:'profile-global@test.invalid',role:'Administrador',isPlatformAdmin:true,passwordHash:hash}});
  server=spawn(process.execPath,[path.join(root,'deploy/start-server.cjs')],{cwd:root,env,stdio:['ignore','pipe','pipe']});
  server.stdout.on('data',()=>{});server.stderr.on('data',b=>{fs.appendFileSync(path.join(root,'uploads','profile-test-server.log'),b)});
  for(let i=0;i<40;i++){try{if((await fetch(base+'/api/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,500));}
  const anonymous=await fetch(base+'/profile',{redirect:'manual'});assert.ok([303,307,308].includes(anonymous.status));check('anonymous profile access redirected');
  const initial=await sources(await (await fetch(base)).text());
  const login=async email=>action(actionId(initial,'loginUserAction'),[email,password],undefined,'/');
  const logged=await login(operator.email);let cookie=logged.cookie;assert.ok(cookie);
  const html=await (await fetch(base+'/profile',{headers:{Cookie:cookie}})).text();assert.ok(html.includes('Meu perfil')&&html.includes('Loja de teste Perfil'));
  const js=initial+'\n'+await sources(html);
  const call=(name,args,c=cookie)=>action(actionId(js,name),args,c);
  let profile=(await call('getProfileAction',[])).value;assert.equal(profile.uid,operator.uid);assert.ok(!JSON.stringify(profile).includes('passwordHash'));check('store operator profile loads without credential hashes');
  await call('updateProfileAction',[{name:'Nome atualizado'}]);profile=(await call('getProfileAction',[])).value;assert.equal(profile.name,'Nome atualizado');check('name update persists on authenticated account');
  await assert.rejects(call('updateProfileAction',[{name:'Ataque',uid:other.uid,email:'tampered@test.invalid',isPlatformAdmin:true}]));assert.equal((await owner.user.findUnique({where:{uid:other.uid}})).name,other.name);check('extra account identifiers and privilege fields rejected');
  await assert.rejects(call('updateProfileAction',[{name:'X',photo:'data:image/webp;base64,AAAA'}]));check('invalid profile and photo rejected');
  const photo='data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
  await call('updateProfileAction',[{name:'Nome atualizado',photo}]);profile=(await call('getProfileAction',[])).value;
  const avatar=await fetch(base+profile.avatarUrl,{headers:{Cookie:cookie}});assert.equal(avatar.status,200);assert.equal(avatar.headers.get('content-type'),'image/webp');
  assert.equal((await fetch(base+profile.avatarUrl)).status,404);
  const otherLogin=await login(other.email);assert.equal((await fetch(base+profile.avatarUrl,{headers:{Cookie:otherLogin.cookie}})).status,404);check('avatar persists and denies anonymous and unrelated store access');
  await call('updateProfileAction',[{name:'Nome atualizado',removePhoto:true}]);assert.equal((await call('getProfileAction',[])).value.avatarUrl,null);check('photo removal persists');
  const version=(await owner.user.findUnique({where:{uid:operator.uid}})).sessionVersion;
  await assert.rejects(call('changeOwnPasswordAction',[{currentPassword:'wrong',newPassword:nextPassword,confirmation:nextPassword}]));
  await assert.rejects(call('changeOwnPasswordAction',[{currentPassword:password,newPassword:nextPassword,confirmation:'different'}]));
  await assert.rejects(call('changeOwnPasswordAction',[{currentPassword:password,newPassword:'short',confirmation:'short'}]));
  assert.equal((await owner.user.findUnique({where:{uid:operator.uid}})).sessionVersion,version);check('wrong current password, mismatch and weak password leave account unchanged');
  const stale=cookie;const changed=await call('changeOwnPasswordAction',[{currentPassword:password,newPassword:nextPassword,confirmation:nextPassword}]);cookie=changed.cookie;assert.ok(cookie);
  await assert.rejects(call('getProfileAction',[],stale));assert.equal((await call('getProfileAction',[])).value.uid,operator.uid);
  await assert.rejects(login(operator.email));
  const fresh=await action(actionId(initial,'loginUserAction'),[operator.email,nextPassword],undefined,'/');assert.ok(fresh.cookie);check('password change revokes old session and accepts only new password');
  await assert.rejects(call('revokeOtherSessionsAction',['wrong']));
  const revoked=await call('revokeOtherSessionsAction',[nextPassword]);cookie=revoked.cookie;assert.ok(cookie);
  await assert.rejects(call('getProfileAction',[],fresh.cookie));assert.equal((await call('getProfileAction',[])).value.uid,operator.uid);check('other sessions revoked while current session stays authenticated');
  const globalLogin=await login(global.email);const globalProfile=(await call('getProfileAction',[],globalLogin.cookie)).value;assert.equal(globalProfile.isPlatformAdmin,true);assert.equal(globalProfile.stores.length,0);
  await call('updateProfileAction',[{name:'Global atualizado'}],globalLogin.cookie);assert.equal((await call('getProfileAction',[],globalLogin.cookie)).value.name,'Global atualizado');check('global profile works without store membership');
  const context=async(tx,uid)=>tx.$executeRaw`SELECT set_config('app.user_id',${uid},true),set_config('app.profile_write','true',true),set_config('app.platform_admin','false',true),set_config('app.store_id','',true)`;
  for(const uid of [operator.uid,global.uid]){
   await assert.rejects(db.$transaction(async tx=>{await context(tx,uid);await tx.user.update({where:{uid},data:{email:'forbidden@test.invalid'}})}));
   await assert.rejects(db.$transaction(async tx=>{await context(tx,uid);await tx.user.update({where:{uid},data:{isPlatformAdmin:true,disabled:true}})}));
   await assert.rejects(db.$transaction(async tx=>{await context(tx,uid);await tx.user.update({where:{uid},data:{disabled:true}})}));
   await assert.rejects(db.$transaction(async tx=>{await context(tx,uid);await tx.user.update({where:{uid},data:{sessionVersion:-1}})}));
   await assert.rejects(db.$transaction(async tx=>{await context(tx,uid);await tx.user.update({where:{uid:other.uid},data:{name:'Forbidden'}})}));
  }
  assert.equal((await owner.user.findUnique({where:{uid:operator.uid}})).isPlatformAdmin,false);check('database policies and trigger deny cross-account changes and protected fields');
  console.log(`PROFILE_TESTS_PASSED ${pass}`);
 }finally{
  if(server){server.kill();await new Promise(resolve=>{if(server.exitCode!==null)resolve();else{server.once('exit',resolve);setTimeout(resolve,5000)}})}
  await db.$disconnect();
  // Only this hardcoded disposable schema and its own avatar directory are removed.
  await owner.$executeRawUnsafe('DROP SCHEMA IF EXISTS "'+target+'" CASCADE');await owner.$disconnect();
  const testDirectory=path.join(root,'uploads','profile-test');if(!testDirectory.startsWith(root+path.sep))throw Error('Invalid test directory');fs.rmSync(testDirectory,{recursive:true,force:true});
 }
}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
