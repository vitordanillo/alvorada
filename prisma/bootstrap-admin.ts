import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({ datasourceUrl:process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL, log: ['error'] });

async function main() {
  const name = process.env.ALVORADA_ADMIN_NAME;
  const email = process.env.ALVORADA_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ALVORADA_ADMIN_PASSWORD;
  if (!name?.trim() || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8 || Buffer.byteLength(password) > 72) {
    throw new Error('Set a valid ALVORADA_ADMIN_NAME, ALVORADA_ADMIN_EMAIL and ALVORADA_ADMIN_PASSWORD (8 characters minimum; 72 bytes maximum).');
  }
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    if (await tx.user.count() > 0) {
      throw new Error('An account already exists. Bootstrap will not modify existing users.');
    }

    const store = await tx.store.create({ data: { name: process.env.ALVORADA_STORE_NAME?.trim() || 'Loja Principal',organization:{create:{name:process.env.ALVORADA_STORE_NAME?.trim() || 'Loja Principal'}} } });
    const user=await tx.user.create({
      data: {
        uid: randomUUID(),
        isPlatformAdmin:true,
        name: name.trim(),
        email,
        passwordHash,
        role: 'Administrador',
        storeId: store.id,
      },
    });
    await tx.storeMembership.create({data:{userId:user.uid,storeId:store.id,role:'Administrador'}});
  });

  console.log(`Initial administrator created for ${email}. No demo records were added.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Administrator bootstrap failed.');
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
