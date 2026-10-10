'use strict';
const {execFileSync}=require('node:child_process');
const PREFIX=Buffer.from('GRANZOTI-DPAPI-1\n');
function transform(bytes,operation){
 if(process.platform!=='win32')throw new Error('Backup protegido requer Windows.');
 const script="Add-Type -AssemblyName System.Security; $bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $result=[Security.Cryptography.ProtectedData]::"+operation+"($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Write([Convert]::ToBase64String($result))";
 return Buffer.from(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{input:bytes.toString('base64'),encoding:'utf8',maxBuffer:256*1024*1024,windowsHide:true}).trim(),'base64');
}
function protect(bytes){return Buffer.concat([PREFIX,transform(bytes,'Protect')]);}
function unprotect(bytes){return bytes.subarray(0,PREFIX.length).equals(PREFIX)?transform(bytes.subarray(PREFIX.length),'Unprotect'):bytes;}
module.exports={protect,unprotect};
