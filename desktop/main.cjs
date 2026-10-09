'use strict';
const {app, BrowserWindow, Menu, ipcMain, dialog, shell, Notification} = require('electron');
const {autoUpdater} = require('electron-updater');
const {Storage} = require('./storage.cjs');
const {LocalShell} = require('./shell.cjs');
const path = require('node:path');
const fs = require('node:fs');
const ORIGIN = 'https://alvorada.firmaconecta.com';
app.setName('Granzoti Sistemas');
app.setAppUserModelId('com.firmaconecta.alvorada');
// Stable across all versions, separate from the executable and installation folder.
const dataDirectory=path.join(app.getPath('appData'), 'FirmaConecta', 'Alvorada');
fs.mkdirSync(dataDirectory,{recursive:true});
const sessionDirectory=path.join(dataDirectory,'browser');fs.mkdirSync(sessionDirectory,{recursive:true});
app.setPath('userData',dataDirectory);
app.setPath('sessionData',sessionDirectory);
let win, storage, localShell, appSession, downloaded = false, installing = false, shuttingDown = false, closing = false;
let status = {state:'idle', version:app.getVersion(), message:'Atualizações verificadas automaticamente.'};
const recovery = path.join(__dirname,'recovery.html');
const trusted = event => !!win && event.sender === win.webContents && event.senderFrame === event.sender.mainFrame && new URL(event.senderFrame.url).origin === ORIGIN;
function publish(next) {status = {...status,...next}; if(win && !win.isDestroyed())win.webContents.send('alvorada:update-status',status);}
function log(message) {
  const file = path.join(app.getPath('userData'),'desktop.log');
  if(fs.existsSync(file)&&fs.statSync(file).size>1024*1024)fs.renameSync(file,file+'.previous');
  fs.appendFileSync(file, `${new Date().toISOString()} ${message}\n`);
}
async function openApp() {
  try {await win.loadURL(ORIGIN+'/pos');}
  catch(error) {log(`navigation: ${error.code || 'error'} ${error.message}`);if(!win.isDestroyed())await win.loadFile(recovery);}
}
function menu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {label:'Granzoti Sistemas',submenu:[
      {label:'Abrir PDV',click:()=>openApp()},
      {label:'Verificar atualizações',click:()=>checkUpdates(true)},
      {label:'Situação da atualização',click:()=>dialog.showMessageBox(win,{type:'info',title:'Atualização do Granzoti Sistemas',message:status.message,detail:`Versão instalada: ${app.getVersion()}`})},
      {label:'Criar cópia dos dados locais',click:async()=>{try{await storage.snapshot('manual');await dialog.showMessageBox(win,{message:'Cópia dos dados locais criada.',detail:'Guardada na pasta de backups do Granzoti Sistemas.'});}catch{await dialog.showMessageBox(win,{type:'error',message:'Não foi possível criar a cópia. Os dados originais foram preservados.'});}}},
      {type:'separator'}, {label:'Sair',role:'quit'}
    ]},
    {label:'Editar',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
    {label:'Exibir',submenu:[{role:'reload'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]},
    {label:'Ajuda',submenu:[{label:'Sobre o Granzoti Sistemas',click:()=>dialog.showMessageBox(win,{message:'Granzoti Sistemas',detail:`Versão ${app.getVersion()}\nGestão de lojas com operação offline e atualização automática.`})}]}
  ]));
}
async function checkUpdates(manual = false) {
  if(!app.isPackaged){publish({message:'Atualizações disponíveis na versão instalada.'});return;}
  try {await autoUpdater.checkForUpdates();}
  catch {publish({state:'error',message:'Não foi possível verificar atualizações. Nova tentativa será feita automaticamente.'});if(manual)await dialog.showMessageBox(win,{message:status.message});}
}
function setupUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false; // Controlled below: backup must succeed first.
  autoUpdater.allowDowngrade = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.on('checking-for-update',()=>publish({state:'checking',message:'Verificando atualizações…'}));
  autoUpdater.on('update-available', info=>publish({state:'downloading',availableVersion:info.version,message:'Nova versão disponível. Baixando em segundo plano…'}));
  autoUpdater.on('download-progress', progress=>publish({state:'downloading',percent:Math.round(progress.percent),message:`Baixando atualização: ${Math.round(progress.percent)}%. Você pode continuar trabalhando.`}));
  autoUpdater.on('update-not-available',()=>publish({state:'current',message:'O Granzoti Sistemas está atualizado.'}));
  autoUpdater.on('error', error=>{log(`updater: ${error.code || 'error'}`);publish({state:'error',message:'Atualização indisponível no momento. Seus dados foram preservados; tentaremos novamente.'});if(installing)app.quit();});
  autoUpdater.on('update-downloaded',()=>{
    downloaded=true;
    publish({state:'ready',message:'Atualização baixada. Será aplicada ao encerrar o aplicativo.'});
    if(Notification.isSupported())new Notification({title:'Atualização do Granzoti Sistemas',body:'Nova versão pronta. Continue trabalhando; ela será aplicada ao encerrar o aplicativo.'}).show();
  });
  setTimeout(()=>checkUpdates(),15000).unref();
  setInterval(()=>checkUpdates(),4*60*60*1000).unref();
}
if(!app.requestSingleInstanceLock())app.quit();
else {
  app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus();}});
  app.whenReady().then(async()=>{
    storage=new Storage(app.getPath('userData'));
    win=new BrowserWindow({width:1440,height:940,minWidth:1000,minHeight:700,title:'Granzoti Sistemas',backgroundColor:'#f8fafc',icon:path.join(__dirname,'assets/icon.ico'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,partition:'persist:alvorada'}});
    appSession=win.webContents.session;
    localShell=new LocalShell(appSession,storage);
    win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==ORIGIN){event.preventDefault();}});
    win.webContents.on('will-redirect',(event,url)=>{if(new URL(url).origin!==ORIGIN){event.preventDefault();}});
    win.webContents.on('will-attach-webview',event=>event.preventDefault());
    win.webContents.setWindowOpenHandler(({url})=>{
      // Existing receipt printing opens an isolated about:blank window.
      if(url==='about:blank')return {action:'allow',overrideBrowserWindowOptions:{webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}}};
      if(url.startsWith('https:'))void shell.openExternal(url);
      return {action:'deny'};
    });
    appSession.setPermissionCheckHandler((_contents,permission,origin,details)=>origin===ORIGIN&&(permission==='persistent-storage'||permission==='media'&&details.mediaType==='video'));
    appSession.setPermissionRequestHandler((_contents,permission,callback,details)=>callback(details.requestingUrl?.startsWith(ORIGIN+'/')&&(permission==='persistent-storage'||permission==='media'&&details.mediaTypes?.includes('video')&&!details.mediaTypes?.includes('audio'))));
    ipcMain.handle('alvorada:storage',(event,...args)=>{if(!trusted(event))throw new Error('Origem não autorizada.');return storage.invoke(...args);});
    ipcMain.handle('alvorada:update-status',event=>{if(!trusted(event))throw new Error('Origem não autorizada.');return status;});
    ipcMain.handle('alvorada:scope',(event,scope,expires)=>{if(!trusted(event))throw new Error('Origem não autorizada.');if(scope===null)localShell.lock();else localShell.activate(scope,expires);});
    ipcMain.handle('alvorada:retry',async event=>{if(event.sender!==win.webContents||event.senderFrame.url!==require('node:url').pathToFileURL(recovery).href)throw new Error('Origem não autorizada.');await openApp();});
    win.on('closed',()=>{win=null;});
    menu();setupUpdater();await openApp();
  }).catch(async error=>{log(`startup: ${error.message}`);await dialog.showMessageBox({type:'error',message:'Não foi possível abrir o Granzoti Sistemas.',detail:'Os dados locais foram preservados. Consulte o suporte da Granzoti Sistemas.'});app.exit(1);});
  app.on('before-quit',event=>{
    if(shuttingDown||installing)return;
    if(closing){event.preventDefault();return;}
    if(!storage){shuttingDown=true;return;}
    event.preventDefault();
    closing=true;
    (async()=>{
      try {
        appSession.flushStorageData();
        await appSession.cookies.flushStore();
        if(downloaded)await storage.snapshot(`before-update-${app.getVersion()}`);
        storage.db.exec('PRAGMA wal_checkpoint(FULL)');
        storage.close();storage=null;
        if(downloaded){installing=true;autoUpdater.quitAndInstall(true,false);}
        else{shuttingDown=true;app.quit();}
      }catch(error){closing=false;log(`shutdown: ${error.message}`);downloaded=false;publish({state:'error',message:'Atualização adiada porque a cópia de segurança não foi concluída.'});await dialog.showMessageBox({type:'error',message:'A atualização foi adiada.',detail:'Não foi possível criar a cópia de segurança dos dados locais. Libere espaço e tente encerrar novamente.'});}
    })();
  });
  app.on('window-all-closed',()=>app.quit());
}
