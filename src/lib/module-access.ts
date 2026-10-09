import { prisma } from './db';
import { getAuthenticatedUser, verifyUserRole } from './auth';
import type { ModuleKey } from './module-catalog';

export async function requireModule(key:ModuleKey, expectedStoreId:string) {
  const user=await verifyUserRole(['Administrador','Gerente','Operador de Caixa']);
  if(user.storeId!==expectedStoreId) throw new Error('A loja ativa mudou. Atualize a página.');
  const grant=await prisma.organizationModule.findUnique({where:{organizationId_moduleKey:{organizationId:user.store.organizationId,moduleKey:key}}});
  if(!grant?.enabled) throw new Error('Este módulo não está liberado para sua empresa.');
  return user;
}

export async function getEnabledModules() {
  const user=await getAuthenticatedUser();
  return (await prisma.organizationModule.findMany({where:{organizationId:user.store.organizationId,enabled:true},select:{moduleKey:true}})).map(m=>m.moduleKey);
}
