'use strict';
const {DatabaseSync, backup} = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

class Storage {
  constructor(directory) {
    fs.mkdirSync(directory, {recursive: true});
    this.directory = directory;
    this.db = new DatabaseSync(path.join(directory, 'alvorada.sqlite'));
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
    const version = this.db.prepare('PRAGMA user_version').get().user_version;
    if (version > 1) throw new Error('Este banco exige uma versão mais recente do Alvorada.');
    this.db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS records (scope TEXT NOT NULL, bucket TEXT NOT NULL, id TEXT NOT NULL, value TEXT NOT NULL, sequence INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(scope,bucket,id));
      CREATE TABLE IF NOT EXISTS migrations (scope TEXT PRIMARY KEY, completed INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS shell (scope TEXT NOT NULL, path TEXT NOT NULL, html TEXT NOT NULL, PRIMARY KEY(scope,path));
      CREATE TABLE IF NOT EXISTS metadata (id TEXT PRIMARY KEY,value TEXT NOT NULL);
      PRAGMA user_version=1; COMMIT;`);
  }
  validate(scope, bucket, id) {
    if (typeof scope !== 'string' || !/^[a-zA-Z0-9-]+:[a-zA-Z0-9-]+$/.test(scope) || scope.length > 180) throw new Error('Loja e usuário inválidos.');
    if (!['cachedData', 'salesQueue', 'operations'].includes(bucket)) throw new Error('Armazenamento inválido.');
    if (typeof id !== 'string' || !id || id.length > 500) throw new Error('Registro inválido.');
  }
  transact(work) {
    this.db.exec('BEGIN IMMEDIATE');
    try {const value = work(); this.db.exec('COMMIT'); return value;}
    catch (error) {this.db.exec('ROLLBACK'); throw error;}
  }
  write(scope, bucket, id, value, imported = false) {
    this.validate(scope, bucket, id);
    const encoded = JSON.stringify(value);
    if (!encoded || Buffer.byteLength(encoded) > 24 * 1024 * 1024) throw new Error('Registro local muito grande.');
    let sequence = 0;
    if (bucket !== 'cachedData') {
      if (!value || value.id !== id) throw new Error('Identificador divergente.');
      if (bucket === 'operations' && (value.userId + ':' + value.storeId !== scope || !['pending', 'conflict'].includes(value.state))) throw new Error('Operação de outra loja ou conta.');
      const prior = this.db.prepare('SELECT sequence FROM records WHERE scope=? AND bucket=? AND id=?').get(scope, bucket, id);
      const max = this.db.prepare('SELECT MAX(sequence) AS n FROM records WHERE scope=? AND bucket=?').get(scope, bucket).n || 0;
      sequence = prior?.sequence || (imported && Number.isSafeInteger(value.sequence) ? value.sequence : Math.max(Date.now() * 1000, max) + 1);
      value = {...value, sequence};
    }
    const sql = imported ? 'INSERT OR IGNORE INTO records(scope,bucket,id,value,sequence) VALUES (?,?,?,?,?)' : 'INSERT INTO records(scope,bucket,id,value,sequence) VALUES (?,?,?,?,?) ON CONFLICT(scope,bucket,id) DO UPDATE SET value=excluded.value, sequence=excluded.sequence';
    this.db.prepare(sql).run(scope, bucket, id, JSON.stringify(value), sequence);
  }
  invoke(command, scope, bucket, id, value) {
    this.validate(scope, bucket || 'cachedData', id || '_');
    switch (command) {
      case 'get': return JSON.parse(this.db.prepare('SELECT value FROM records WHERE scope=? AND bucket=? AND id=?').get(scope,bucket,id)?.value || 'null');
      case 'all': return this.db.prepare('SELECT value FROM records WHERE scope=? AND bucket=? ORDER BY sequence,id').all(scope,bucket).map(row => JSON.parse(row.value));
      case 'put': return this.transact(() => this.write(scope,bucket,id,value));
      case 'remove': this.db.prepare('DELETE FROM records WHERE scope=? AND bucket=? AND id=?').run(scope,bucket,id); return;
      case 'migrated': return !!this.db.prepare('SELECT completed FROM migrations WHERE scope=?').get(scope)?.completed;
      case 'import': return this.transact(() => {
        if (!value || !Array.isArray(value.records) || value.records.length > 20000) throw new Error('Importação inválida.');
        for (const row of value.records) this.write(scope,row.bucket,row.id,row.value,true);
        this.db.prepare('INSERT OR REPLACE INTO migrations(scope,completed) VALUES (?,1)').run(scope);
      });
      default: throw new Error('Comando local inválido.');
    }
  }
  async snapshot(label) {
    const dir = path.join(this.directory, 'backups');
    fs.mkdirSync(dir, {recursive:true});
    const file = path.join(dir, `alvorada-${label.replace(/[^a-zA-Z0-9.-]/g,'_')}-${Date.now()}.sqlite`);
    await backup(this.db, file);
    // Keep the most recent ten snapshots; never remove the working database.
    const files = fs.readdirSync(dir).filter(name=>/^alvorada-.*\.sqlite$/.test(name)).sort((a,b)=>fs.statSync(path.join(dir,b)).mtimeMs-fs.statSync(path.join(dir,a)).mtimeMs);
    for (const name of files.slice(10)) fs.unlinkSync(path.join(dir,name));
    return file;
  }
  close() {this.db.close();}
}
module.exports = {Storage};
