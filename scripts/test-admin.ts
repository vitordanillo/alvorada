import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

async function main(){
  const url=new URL(process.env.TEST_DATABASE_URL!);
  if(!url.searchParams.get('schema')?.endsWith('_test'))throw Error('Disposable schema required.');
  process.env.DATABASE_URL=url.toString();
  const owner=new PrismaClient({datasourceUrl:process.env.TEST_DIRECT_DATABASE_URL,log:[]});
  const {prisma,withDbContext}=await import('../src/lib/db');
  const {resolveUser}=await import('../src/lib/auth');
  const {createStoreAction,grantStoreAccessAction}=await import('../src/lib/platform-actions');
  const {getAdminDataAction,savePlanAction,saveSubscriptionAction,recordInvoicePaymentAction,manageUserAction}=await import('../src/lib/admin-actions');
  const {generateDueInvoices}=await import('../src/lib/billing');
  const id=randomUUID(),email=`${id}@test.invalid`;
  const admin={uid:id,name:'Test admin',email,role:'Administrador' as const,isPlatformAdmin:true};
  const asAdmin=<T>(operation:()=>Promise<T>)=>withDbContext({uid:id,platformAdmin:true,storeId:'',user:admin},operation);
  let storeId:string|undefined,orgId:string|undefined,operatorId:string|undefined,planId:string|undefined;
  try {
    await owner.user.create({data:{uid:id,email,name:admin.name,role:'Administrador',passwordHash:'fixture',isPlatformAdmin:true}});
    const store=await asAdmin(()=>createStoreAction({name:'Disposable billing test',adminName:'Test operator',adminEmail:`store-${email}`,adminPassword:'TemporaryTestOnly123!'}));
    storeId=store.id;orgId=store.organizationId;
    const operator=await owner.user.findUniqueOrThrow({where:{email:`store-${email}`}});operatorId=operator.uid;
    assert.equal((await resolveUser(id))?.storeId,undefined);
    console.log('PASS global admin has no selected store');
    const defaultStore=await owner.store.create({data:{name:'Default without access',organizationId:orgId!}});
    try {
      await owner.user.update({where:{uid:operator.uid},data:{storeId:defaultStore.id}});
      assert.equal((await resolveUser(operator.uid))?.storeId,storeId);
      console.log('PASS login falls back to an authorized store after default membership removal');
    } finally {
      await owner.user.update({where:{uid:operator.uid},data:{storeId}});
      await owner.store.delete({where:{id:defaultStore.id}});
    }
    await assert.rejects(withDbContext({uid:operator.uid,storeId,platformAdmin:false,user:{...admin,uid:operator.uid,isPlatformAdmin:false,storeId}},()=>getAdminDataAction()),/restrito/);
    console.log('PASS ordinary account cannot invoke admin actions');
    await asAdmin(()=>savePlanAction({name:`Plan ${id}`,priceCents:9900,maxUsers:1,active:true,description:'fixture'}));
    const plan=await owner.plan.findFirstOrThrow({where:{name:`Plan ${id}`}});planId=plan.id;
    const today=(await asAdmin(()=>getAdminDataAction())).today.slice(0,10);
    await asAdmin(()=>saveSubscriptionAction({storeId,planId:plan.id,priceCents:9900,maxUsers:1,nextDue:today,notes:''}));
    await Promise.all([asAdmin(()=>generateDueInvoices()),asAdmin(()=>generateDueInvoices())]);
    const subscription=await owner.subscription.findUniqueOrThrow({where:{storeId}});
    assert.equal(await owner.invoice.count({where:{subscriptionId:subscription.id}}),1);
    console.log('PASS retries create exactly one invoice per period');
    await asAdmin(()=>savePlanAction({id:plan.id,name:plan.name,priceCents:19900,maxUsers:3,active:true,description:''}));
    assert.equal((await owner.subscription.findUniqueOrThrow({where:{storeId}})).priceCents,9900);
    console.log('PASS plan changes preserve contract price');
    await assert.rejects(asAdmin(()=>grantStoreAccessAction(storeId!,email,'Gerente')),/global/);
    await assert.rejects(asAdmin(()=>manageUserAction({uid:operator.uid,operation:'unlink',storeId,reason:'Testing last administrator guard'})),/outro administrador/);
    console.log('PASS global membership and last administrator protected');
    const invoice=await owner.invoice.findFirstOrThrow({where:{subscriptionId:subscription.id}});
    await asAdmin(()=>recordInvoicePaymentAction({id:invoice.id,paidAt:today,method:'Pix',reference:'test',notes:''}));
    await assert.rejects(asAdmin(()=>recordInvoicePaymentAction({id:invoice.id,paidAt:today,method:'Pix',reference:'duplicate',notes:''})),/foi paga/);
    console.log('PASS manual payment cannot be registered twice');
    const visible=await withDbContext({uid:operator.uid,storeId,platformAdmin:false},()=>prisma.invoice.count());
    assert.equal(visible,0);
    console.log('PASS runtime RLS hides billing from ordinary store context');
    await asAdmin(()=>manageUserAction({uid:operator.uid,operation:'revoke',reason:'Testing session revocation'}));
    assert.equal((await owner.user.findUniqueOrThrow({where:{uid:operator.uid}})).sessionVersion,1);
    console.log('PASS revocation increments session version');
    const data=await asAdmin(()=>getAdminDataAction('users'));
    assert.ok(!JSON.stringify(data.records).includes('passwordHash'));
    console.log('PASS admin listings exclude credential hashes');
  } finally {
    if(storeId){
      const subscription=await owner.subscription.findUnique({where:{storeId}});
      if(subscription){await owner.invoice.deleteMany({where:{subscriptionId:subscription.id}});await owner.subscription.delete({where:{id:subscription.id}});}
      await owner.storeMembership.deleteMany({where:{storeId}});
      await owner.systemConfig.deleteMany({where:{storeId}});
      if(operatorId)await owner.user.delete({where:{uid:operatorId}});
      await owner.store.delete({where:{id:storeId}});
    }
    if(orgId)await owner.organization.delete({where:{id:orgId}});
    if(planId)await owner.plan.delete({where:{id:planId}});
    await owner.platformAuditLog.deleteMany({where:{actorId:id}});
    await owner.user.deleteMany({where:{uid:id}});
    await prisma.$disconnect();await owner.$disconnect();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});


