const { contextBridge, ipcRenderer } = require('electron');

const ARG = '--veyno-variante=';
const variante = ((process.argv || []).find(a => a.startsWith(ARG)) || '').slice(ARG.length) === 'lite' ? 'lite' : 'voll';

contextBridge.exposeInMainWorld('veynoNative', {
  variante,
  ordnerWaehlen: (zweck) => ipcRenderer.invoke('veyno:ordnerWaehlen', zweck === 'ziel' ? 'ziel' : 'quelle'),
  dateienListen: (ordner) => ipcRenderer.invoke('veyno:dateienListen', ordner),
  dateiLesen: (ordner, name, start, laenge) => ipcRenderer.invoke('veyno:dateiLesen', ordner, name, start, laenge),
  dateiSchreiben: (ordner, name, bytes) => ipcRenderer.invoke('veyno:dateiSchreiben', ordner, name, bytes),
  ordnerZeigen: (ordner) => ipcRenderer.invoke('veyno:ordnerZeigen', ordner),
  freierPlatz: (ordner) => ipcRenderer.invoke('veyno:freierPlatz', ordner),
  wachHalten: (an) => ipcRenderer.invoke('veyno:wachHalten', !!an),
});
