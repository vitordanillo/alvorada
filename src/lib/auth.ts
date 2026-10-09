import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma, withDbContext, currentDbUser } from './db';
import type { Store, StoreMembership, User } from './types';

const SESSION_COOKIE = 'alvorada-session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
type Session = { uid: string; storeId?: string; exp: number; version?: number };

function secret(): string {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value || Buffer.byteLength(value) < 32) throw new Error('AUTH_SESSION_SECRET must contain at least 32 bytes.');
  return value;
}

function readSession(token?: string): Session | null {
  if (!token) return null;
  try {
    const [payload,signature,extra] = token.split('.');
    if (!payload || !signature || extra) return null;
    const expected=createHmac('sha256',secret()).update(payload).digest();
    const actual=Buffer.from(signature,'base64url');
    if (actual.length!==expected.length || !timingSafeEqual(actual,expected)) return null;
    const value=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    if (typeof value.uid!=='string' || typeof value.exp!=='number' || value.exp<=Date.now() || (value.storeId!==undefined && typeof value.storeId!=='string')) return null;
    return value;
  } catch { return null; }
}

export async function setAuthCookie(uid: string, storeId?: string) {
  const record=await withDbContext({uid,email:'',storeId:'',platformAdmin:false},()=>prisma.user.findUnique({where:{uid},select:{sessionVersion:true,disabled:true}}));
  if(!record || record.disabled) throw new Error('Conta desabilitada.');
  const payload=Buffer.from(JSON.stringify({ uid,storeId,version:record.sessionVersion,exp:Date.now()+SESSION_MAX_AGE*1000 })).toString('base64url');
  const signature=createHmac('sha256',secret()).update(payload).digest('base64url');
  (await cookies()).set(SESSION_COOKIE,`${payload}.${signature}`,{
    path:'/',httpOnly:true,secure:process.env.AUTH_COOKIE_SECURE!=='false' && process.env.NODE_ENV==='production',sameSite:'lax',maxAge:SESSION_MAX_AGE,
  });
}

export const mapStore = (store: any): Store => ({
  id:store.id,name:store.name,cnpj:store.cnpj ?? '',address:store.address ?? '',phone:store.phone ?? '',
  status:store.status,organizationId:store.organizationId,
});

export async function resolveUser(uid: string, requestedStoreId?: string): Promise<User | null> {
  return withDbContext({ uid,email:'',storeId:'',platformAdmin:false },async()=>{
    const record=await prisma.user.findUnique({where:{uid}});
    if (!record || record.disabled) return null;
    const memberships=await prisma.storeMembership.findMany({where:{userId:uid},include:{store:true},orderBy:{createdAt:'asc'}});
    const stores: StoreMembership[]=memberships.map(m=>({...mapStore(m.store),role:m.role as User['role']}));
    const selectedId=record.isPlatformAdmin ? requestedStoreId : requestedStoreId ?? stores.find(s=>s.id===record.storeId && s.status==='Ativa')?.id ?? stores.find(s=>s.status==='Ativa')?.id;
    let selected=stores.find(s=>s.id===selectedId && s.status==='Ativa');
    if (!selected && record.isPlatformAdmin && requestedStoreId) {
      const store=await withDbContext({platformAdmin:true},()=>prisma.store.findUnique({where:{id:requestedStoreId}}));
      if (store?.status==='Ativa') selected={...mapStore(store),role:'Administrador'};
    }
    if(selected) {
      selected.enabledModules=await withDbContext({storeId:selected.id},async()=>
        (await prisma.organizationModule.findMany({where:{organizationId:selected!.organizationId,enabled:true},select:{moduleKey:true}})).map(m=>m.moduleKey));
    }
    return {uid:record.uid,name:record.name,email:record.email,avatarUrl:record.avatarUrl ?? undefined,
      role:selected?.role ?? 'Administrador',storeId:selected?.id,store:selected,isPlatformAdmin:record.isPlatformAdmin,mustChangePassword:record.mustChangePassword,stores};
  });
}

export async function currentUser(): Promise<User | null> {
  const cached=currentDbUser();
  if (cached) return cached;
  const session=readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if(session) {
    const record=await withDbContext({uid:session.uid,email:'',storeId:'',platformAdmin:false},()=>prisma.user.findUnique({where:{uid:session.uid},select:{sessionVersion:true,disabled:true}}));
    if(!record || record.disabled || record.sessionVersion!==(session.version??0)) return null;
  }
  const user=session ? await resolveUser(session.uid,session.storeId) : null;
  return user && (user.storeId || user.isPlatformAdmin) ? user : null;
}

export async function withAuthenticatedAction<T>(operation: () => Promise<T>, scope: 'store'|'platform'|'identity'='store'): Promise<T> {
  const cached=currentDbUser();
  if (cached) {
    if(scope!=='identity'&&cached.mustChangePassword)throw new Error('Troque sua senha temporária no Perfil antes de continuar.');
    if (scope==='platform' && !cached.isPlatformAdmin) throw new Error('Acesso restrito à administração da Granzoti Sistemas.');
    if (scope==='store' && !cached.storeId) throw new Error('Selecione uma loja ativa para continuar.');
    return operation();
  }
  const user=await currentUser();
  if (!user) throw new Error('Usuário não autenticado.');
  if(scope!=='identity'&&user.mustChangePassword)throw new Error('Troque sua senha temporária no Perfil antes de continuar.');
  if (scope==='platform' && !user.isPlatformAdmin) throw new Error('Acesso restrito à administração da Granzoti Sistemas.');
  if (scope==='store' && !user.storeId) throw new Error('Selecione uma loja ativa para continuar.');
  return withDbContext({uid:user.uid,email:'',storeId:scope==='platform' ? '' : user.storeId,platformAdmin:scope==='platform' && user.isPlatformAdmin,user},operation);
}

export async function getAuthenticatedUser(): Promise<User & { storeId: string; store: Store }> {
  const user=currentDbUser();
  if (!user?.storeId) throw new Error('Selecione uma loja ativa para continuar.');
  return user as User & { storeId: string; store: Store };
}

export async function verifyUserRole(roles: User['role'][]): Promise<User & { storeId: string; store: Store }> {
  const user=await getAuthenticatedUser();
  if (!roles.includes(user.role)) throw new Error('Acesso negado: privilégios insuficientes.');
  return user;
}
