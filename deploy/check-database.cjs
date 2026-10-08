const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
require('dotenv').config({ path: envPath });
const { PrismaClient } = require('@prisma/client');
async function main() {
  const base = new URL(process.env.DATABASE_URL);
  const hosts = [base.hostname];
  for (const host of [...new Set(hosts)]) {
    const url = new URL(base);
    url.hostname = host;
    url.searchParams.set('connect_timeout', '8');
    const prisma = new PrismaClient({ datasourceUrl: url.toString(), log: [] });
    try {
      const result = await prisma.$queryRaw`SELECT current_user AS role, current_schema() AS schema`;
      console.log(JSON.stringify({ host, ...result[0] }));
      const configured = fs.readFileSync(envPath, 'utf8').replace(base.hostname, host);
      fs.writeFileSync(envPath, configured);
      return;
    } catch (error) {
      console.log(JSON.stringify({ host, status: 'unavailable', code: error.errorCode || error.code || 'connection_failed' }));
    } finally { await prisma.$disconnect(); }
  }
  throw new Error('No session pooler connection succeeded.');
}
main().catch(() => { console.error('Database connectivity failed.'); process.exitCode = 1; });
