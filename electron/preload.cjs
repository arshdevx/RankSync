const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  showNativeNotification: (title, body) => ipcRenderer.invoke('show-native-notification', { title, body }),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
  showWaterOverlay: () => ipcRenderer.invoke('show-water-overlay'),
  closeWaterOverlay: () => ipcRenderer.invoke('close-water-overlay'),
  logWaterFromOverlay: (count) => ipcRenderer.invoke('water-logged-from-overlay', count),
  onSyncWaterCount: (callback) => {
    const handler = (event, count) => callback(count);
    ipcRenderer.on('sync-water-count', handler);
    return () => ipcRenderer.removeListener('sync-water-count', handler);
  },
  saveLocalBackup: (jsonString) => ipcRenderer.invoke('save-local-backup', jsonString),
  readLocalBackup: () => ipcRenderer.invoke('read-local-backup'),
});
