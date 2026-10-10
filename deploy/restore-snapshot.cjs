// Restore only into a pre-created disposable schema, never over production.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const {unprotect}=require('./protected-buffer.cjs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.migrate'), quiet: true });
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient({ datasourceUrl: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL, log: [] });
const quote = value => '"' + value.replaceAll('"','""') + '"';
async function main() {
  const [filename,target] = process.argv.slice(2);
  if (!filename || !/^alvorada_restore_[a-z0-9_]+$/.test(target)) throw new Error('A backup file and disposable restore schema are required.');
  const contents = unprotect(fs.readFileSync(filename)).toString('utf8');
  if (crypto.createHash('sha256').update(contents).digest('hex') !== fs.readFileSync(filename+'.sha256','utf8').trim()) throw new Error('Backup checksum mismatch.');
  const snapshot = JSON.parse(contents);
  const targetSchema = quote(target);
  await db.$transaction(async tx => {
    await tx.$executeRawUnsafe(`SET LOCAL search_path = ${targetSchema}`);
    const existing = await tx.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname=${target}`;
    if (existing.length) throw new Error('Restore schema must be empty.');
    for (const [table,def] of Object.entries(snapshot.definitions)) {
      const cols = def.columns.map(c => `${quote(c.name)} ${c.type}${c.default_value ? ' DEFAULT '+c.default_value : ''}${c.required ? ' NOT NULL':''}`);
      await tx.$executeRawUnsafe(`CREATE TABLE ${targetSchema}.${quote(table)} (${cols.join(',')})`);
      for (const constraint of def.constraints.filter(c=>c.type!=='f')) await tx.$executeRawUnsafe(`ALTER TABLE ${targetSchema}.${quote(table)} ADD CONSTRAINT ${quote(constraint.name)} ${constraint.definition}`);
      for (const index of def.indexes.filter(i=>!def.constraints.some(c=>c.name===i.name))) await tx.$executeRawUnsafe(index.definition.replaceAll(quote(snapshot.schema)+'.',targetSchema+'.').replaceAll(snapshot.schema+'.',target+'.'));
      if (snapshot.data[table].length) await tx.$executeRawUnsafe(`INSERT INTO ${targetSchema}.${quote(table)} SELECT * FROM jsonb_populate_recordset(NULL::${targetSchema}.${quote(table)}, $1::jsonb)`, JSON.stringify(snapshot.data[table]));
    }
    for (const [table,def] of Object.entries(snapshot.definitions)) for (const constraint of def.constraints.filter(c=>c.type==='f')) {
      await tx.$executeRawUnsafe(`ALTER TABLE ${targetSchema}.${quote(table)} ADD CONSTRAINT ${quote(constraint.name)} ${constraint.definition.replaceAll(snapshot.schema+'.',target+'.').replaceAll(quote(snapshot.schema)+'.',targetSchema+'.')}`);
    }
    const counts = {};
    for (const [table,expected] of Object.entries(snapshot.data)) {
      const rows = await tx.$queryRawUnsafe(`SELECT to_jsonb(t) AS row FROM ${targetSchema}.${quote(table)} t ORDER BY to_jsonb(t)::text`);
      if (JSON.stringify(rows.map(r=>r.row)) !== JSON.stringify(expected)) throw new Error('Restored data differs: '+table);
      counts[table]=rows.length;
    }
    console.log(JSON.stringify({ restoredSchema: target, verified: true, counts }));
  }, { timeout: 120000 });
}
main().catch(error => { console.error('Restore failed:', error.code || error.message, error.meta?.message ?? ''); process.exitCode=1; }).finally(()=>db.$disconnect());
