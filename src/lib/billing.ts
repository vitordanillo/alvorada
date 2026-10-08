import { prisma, withTransaction } from './db';

export function nextBillingDate(date: Date, day: number): Date {
  const year=date.getUTCFullYear(), month=date.getUTCMonth()+1;
  const last=new Date(Date.UTC(year,month+1,0)).getUTCDate();
  return new Date(Date.UTC(year,month,Math.min(day,last),12));
}

export function commercialToday(now = new Date()): Date {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const value=(key:string)=>parts.find(p=>p.type===key)!.value;
  return new Date(`${value('year')}-${value('month')}-${value('day')}T12:00:00Z`);
}

// Both scheduled runs and dashboard refreshes may call this. The unique period
// constraint and serializable transactions make retries safe.
export async function generateDueInvoices(): Promise<number> {
  const today=commercialToday();
  const subscriptions=await prisma.subscription.findMany({where:{status:'Ativa',nextDue:{lte:today}},select:{id:true}});
  let generated=0;
  for(const item of subscriptions) {
    generated+=await withTransaction(async tx=>{
      const subscription=await tx.subscription.findUniqueOrThrow({where:{id:item.id}});
      if(subscription.status!=='Ativa') return 0;
      let next=subscription.nextDue, count=0;
      while(next<=today) {
        if(count>=120) throw new Error('Assinatura com mais de 120 competências pendentes. Revise a data de início.');
        await tx.invoice.upsert({where:{subscriptionId_dueDate:{subscriptionId:item.id,dueDate:next}},create:{subscriptionId:item.id,dueDate:next,amountCents:subscription.priceCents},update:{}});
        next=nextBillingDate(next,subscription.billingDay);count++;
      }
      await tx.subscription.update({where:{id:item.id},data:{nextDue:next}});
      return count;
    });
  }
  return generated;
}

export async function ensureUserCapacity(storeId:string,userId?:string) {
  const subscription=await prisma.subscription.findUnique({where:{storeId}});
  if(!subscription || subscription.status==='Cancelada') return;
  if(userId && await prisma.storeMembership.findUnique({where:{userId_storeId:{userId,storeId}}})) return;
  const count=await prisma.storeMembership.count({where:{storeId}});
  if(count>=subscription.maxUsers) throw new Error('Limite de usuários do contrato atingido. Ajuste a assinatura para adicionar acessos.');
}
