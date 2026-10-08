// Private logical snapshot, including schema definitions, from one consistent transaction.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.migrate'), quiet: true });
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient({ datasourceUrl: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL, log: [] });
const quote = value => '"' + value.replaceAll('"', '""') + '"';
async function main() {
  const schema = new URL(process.env.DATABASE_URL).searchParams.get('schema');
  if (schema !== 'alvorada') throw new Error('Backup requires the production Alvorada schema.');
  const directory = path.resolve(__dirname, '../../backups');
  fs.mkdirSync(directory, { recursive: true });
  const snapshot = await db.$transaction(async tx => {
    // Fail instead of silently producing a partial backup when using an RLS role.
    await tx.$executeRawUnsafe('SET LOCAL row_security = off');
    const tables = await tx.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = ${schema} ORDER BY tablename`;
    const data = {};
    const definitions = {};
    for (const { tablename } of tables) {
      const identifier = `${quote(schema)}.${quote(tablename)}`;
      const rows = await tx.$queryRawUnsafe(`SELECT to_jsonb(t) AS row FROM ${identifier} t ORDER BY to_jsonb(t)::text`);
      data[tablename] = rows.map(r => r.row);
      const columns = await tx.$queryRaw`SELECT a.attname AS name, format_type(a.atttypid,a.atttypmod) AS type,
        a.attnotnull AS required, pg_get_expr(d.adbin,d.adrelid) AS default_value
        FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
        LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
        WHERE n.nspname=${schema} AND c.relname=${tablename} AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attnum`;
      const constraints = await tx.$queryRaw`SELECT conname AS name, contype AS type, pg_get_constraintdef(co.oid) AS definition
        FROM pg_constraint co JOIN pg_class c ON c.oid=co.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname=${schema} AND c.relname=${tablename}`;
      const indexes = await tx.$queryRaw`SELECT indexname AS name,indexdef AS definition FROM pg_indexes
        WHERE schemaname=${schema} AND tablename=${tablename}`;
      definitions[tablename] = { columns, constraints, indexes };
    }
    const migrations = Object.fromEntries(fs.readdirSync(path.resolve(__dirname, '../prisma/migrations'), { withFileTypes: true })
      .filter(item=>item.isDirectory()).map(item=>[item.name,fs.readFileSync(path.resolve(__dirname,'../prisma/migrations',item.name,'migration.sql'),'utf8')]));
    return { version: 1, schema, createdAt: new Date().toISOString(), data, definitions,
      prismaSchema:fs.readFileSync(path.resolve(__dirname,'../prisma/schema.prisma'),'utf8'),migrations };
  }, { isolationLevel: 'RepeatableRead', timeout: 120000 });
  const filename = path.join(directory, `alvorada-${Date.now()}.json`);
  const contents = JSON.stringify(snapshot);
  fs.writeFileSync(filename, contents, { mode: 0o600 });
  fs.writeFileSync(filename + '.sha256', crypto.createHash('sha256').update(contents).digest('hex'));
  // Configuration contains the recovery credentials and is kept under the same private ACL.
  fs.copyFileSync(path.resolve(__dirname, '../.env'), filename + '.env');
  const migratorConfig=path.resolve(__dirname, '../.env.migrate');
  if(fs.existsSync(migratorConfig)) fs.copyFileSync(migratorConfig,filename+'.migrate.env');
  console.log(JSON.stringify({ backup: filename, counts: Object.fromEntries(Object.entries(snapshot.data).map(([k,v]) => [k,v.length])) }));
}
main().catch(error => { console.error('Backup failed:', error.code || error.message); process.exitCode=1; }).finally(() => db.$disconnect());
