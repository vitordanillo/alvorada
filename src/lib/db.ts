import { AsyncLocalStorage } from 'node:async_hooks';
import { Prisma, PrismaClient } from '@prisma/client';
import type { User } from './types';

type DbContext = { uid?: string; email?: string; storeId?: string; platformAdmin?: boolean; user?: User; tx?: Prisma.TransactionClient };
const context = new AsyncLocalStorage<DbContext>();
const globalForPrisma = globalThis as unknown as { alvoradaDb?: PrismaClient };
const client = globalForPrisma.alvoradaDb ?? new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.alvoradaDb = client;

export function withDbContext<T>(value: DbContext, operation: () => Promise<T>): Promise<T> {
  return context.run({ ...context.getStore(), ...value }, operation);
}

export function currentDbUser(): User | undefined { return context.getStore()?.user; }

async function setContext(tx: Prisma.TransactionClient, value: DbContext) {
  // Transaction-local settings cannot leak to another request through the pool.
  await tx.$queryRaw`SELECT set_config('app.user_id', ${value.uid ?? ''}, true),
    set_config('app.login_email', ${value.email ?? ''}, true),
    set_config('app.store_id', ${value.storeId ?? ''}, true),
    set_config('app.platform_admin', ${value.platformAdmin ? 'true' : 'false'}, true),
    set_config('app.store_role', ${value.user?.role ?? ''}, true)`;
}

// Delegates inherit the authenticated action's RLS context. Raw SQL is reserved for health checks.
const delegates = new Map<PropertyKey, unknown>();
export const prisma: PrismaClient = new Proxy(client, {
  get(target, property) {
    if (typeof property !== 'string' || property.startsWith('$') || property.startsWith('_')) {
      const value = Reflect.get(target, property);
      return typeof value === 'function' ? value.bind(target) : value;
    }
    const delegate = Reflect.get(target, property);
    if (!delegate || typeof delegate !== 'object') return delegate;
    if (!delegates.has(property)) delegates.set(property, new Proxy(delegate, {
      get(_delegate, method) {
        return async (...args: unknown[]) => {
          const value = context.getStore();
          if (!value) throw new Error('Contexto de acesso ao banco ausente.');
          if (value.tx) return (value.tx as any)[property][method](...args);
          return client.$transaction(async tx => {
            await setContext(tx, value);
            return (tx as any)[property][method](...args);
          }, { maxWait: 10000, timeout: 20000 });
        };
      },
    }));
    return delegates.get(property);
  },
});

export async function withTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  const value = context.getStore();
  if (!value) throw new Error('Contexto de acesso ao banco ausente.');
  if (value.tx) return operation(value.tx);
  for (let attempt = 0; ; attempt++) {
    try {
      return await client.$transaction(async tx => {
        await setContext(tx, value);
        return withDbContext({ tx }, () => operation(tx));
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 25000 });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034' || attempt >= 2) throw error;
    }
  }
}
