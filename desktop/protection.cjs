'use strict';
const {safeStorage}=require('electron');
const PREFIX='dpapi:v1:';
class Protection {
 constructor(){if(process.platform!=='win32'||!safeStorage.isEncryptionAvailable())throw new Error('Proteção de dados do Windows indisponível. Os dados foram preservados.');}
 encode(value){return PREFIX+safeStorage.encryptString(value).toString('base64');}
 decode(value){return value?.startsWith(PREFIX)?safeStorage.decryptString(Buffer.from(value.slice(PREFIX.length),'base64')):value;}
 migrate(db){
  let changed=false;db.exec('BEGIN IMMEDIATE');
  try{
   for(const table of ['records','shell','metadata']){
    const column=table==='shell'?'html':'value';
    for(const row of db.prepare(`SELECT rowid AS rowid,${column} AS value FROM ${table}`).all()){
     if(row.value.startsWith(PREFIX)){this.decode(row.value);continue;}
     db.prepare(`UPDATE ${table} SET ${column}=? WHERE rowid=?`).run(this.encode(row.value),row.rowid);changed=true;
    }
   }
   db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  if(changed)db.exec('PRAGMA wal_checkpoint(TRUNCATE); VACUUM; PRAGMA wal_checkpoint(TRUNCATE);');
 }
}
module.exports={Protection};
