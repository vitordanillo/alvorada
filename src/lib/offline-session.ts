import type {User} from './types';
const key='alvorada-offline-session-v1';
export function rememberOfflineUser(user:User|null){
 if(!user?.storeId||user.mustChangePassword){localStorage.removeItem(key);return;}
 try{localStorage.removeItem('alvorada-offline-signed-out');localStorage.setItem(key,JSON.stringify({user,expires:Date.now()+7*86400000}));}catch{/* The local readiness indicator requires a durable session before marking this device ready. */}
}
export function readOfflineUser():User|null{
 try{const record=JSON.parse(localStorage.getItem(key)??'null');return record?.expires>Date.now()&&record.user?.uid&&record.user?.storeId&&!record.user.mustChangePassword?record.user:null;}catch{return null;}
}
export function forgetOfflineUser(){localStorage.setItem('alvorada-offline-signed-out','1');localStorage.removeItem(key);navigator.serviceWorker?.controller?.postMessage({type:'LOCK'});}
export async function serverReachable():Promise<boolean>{
 if(!navigator.onLine)return false;
 try{const response=await fetch('/api/health',{cache:'no-store',signal:AbortSignal.timeout(4000)});return response.ok;}catch{return false;}
}
