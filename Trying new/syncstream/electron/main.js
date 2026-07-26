const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

// Enable hardware acceleration and native video decoding flags
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

function startBackendServer() {
  const serverScript = path.join(__dirname, '../server/server.js');
  console.log('[Electron] Starting embedded backend server:', serverScript);
  serverProcess = spawn('node', [serverScript], {
    stdio: 'inherit',
    env: { ...process.env, PORT: '3001' },
  });

  serverProcess.on('error', (err) => {
    console.error('[Electron] Failed to start backend server:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'SyncStream — Watch Together',
    backgroundColor: '#0a0a0c',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Allows local range streaming & file access
      allowRunningInsecureContent: true,
    },
  });

  // Load client app
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Native IPC handler for selecting 4GB+ files via Windows file dialog
ipcMain.handle('select-file', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Media Files', extensions: ['mp4', 'mkv', 'webm', 'mov', 'avi', 'flv', 'wmv', 'm4v', '3gp', 'ts', 'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const fileName = path.basename(filePath);
  const streamUrl = `http://localhost:3001/api/stream?path=${encodeURIComponent(filePath)}`;

  return {
    filePath,
    fileName,
    streamUrl,
  };
});

app.on('ready', () => {
  startBackendServer();
  setTimeout(createWindow, 1000);
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
