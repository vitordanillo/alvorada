'use strict';
const {contextBridge, ipcRenderer} = require('electron');
// No generic filesystem, SQL, shell or unrestricted IPC access is exposed.
if (location.origin === 'https://alvorada.firmaconecta.com') {
  contextBridge.exposeInMainWorld('alvoradaDesktop', Object.freeze({
    version: 1,
    storage: (command, scope, bucket, id, value) => ipcRenderer.invoke('alvorada:storage', command, scope, bucket, id, value),
    updateStatus: () => ipcRenderer.invoke('alvorada:update-status'),
    activateScope: (scope,expires) => ipcRenderer.invoke('alvorada:scope',scope,expires),
    lock: () => ipcRenderer.invoke('alvorada:scope',null),
    subscribeUpdates: (callback) => {
      const listener = (_event, value) => callback(value);
      ipcRenderer.on('alvorada:update-status',listener);
      return () => ipcRenderer.removeListener('alvorada:update-status',listener);
    }
  }));
} else if (location.protocol === 'file:') {
  contextBridge.exposeInMainWorld('alvoradaRecovery', Object.freeze({retry: () => ipcRenderer.invoke('alvorada:retry')}));
}
