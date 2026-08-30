const { contextBridge, ipcRenderer, webUtils } = require('electron');

const electronBridge = {
  isElectron: true,
  selectFile: () => ipcRenderer.invoke('select-file'),
  launchVlc: (mediaPath) => ipcRenderer.invoke('launch-vlc', mediaPath),
  getPathForFile: (file) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
    } catch (e) {
      console.warn('getPathForFile failed:', e);
    }
    return file?.path || '';
  }
};

try {
  contextBridge.exposeInMainWorld('electronAPI', electronBridge);
} catch (e) {
  // If contextIsolation is disabled
  if (typeof window !== 'undefined') {
    window.electronAPI = electronBridge;
  }
}
