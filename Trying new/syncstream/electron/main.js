const { app, BrowserWindow, dialog, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');
const net = require('net');

let mainWindow;
let serverStarted = false;

// Enable hardware acceleration and native video decoding flags
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Check if a port is already in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        tester.close();
        resolve(false);
      })
      .listen(port, '127.0.0.1');
  });
}

async function startBackendServer() {
  if (serverStarted) {
    console.log('[Electron] Server already started — skipping.');
    return;
  }

  const port = 3001;
  const inUse = await isPortInUse(port);

  if (inUse) {
    console.log(`[Electron] Port ${port} already in use — assuming embedded server is running.`);
    serverStarted = true;
    return;
  }

  try {
    process.env.PORT = String(port);
    const serverScript = path.join(__dirname, '../server/server.js');
    console.log('[Electron] Starting embedded backend server:', serverScript);
    require(serverScript);
    serverStarted = true;
    console.log('[Electron] Embedded backend server running on port', port);
  } catch (err) {
    console.error('[Electron] Failed to start backend server:', err);
  }
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
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Allows local range streaming & file access
      allowRunningInsecureContent: true,
    },
  });

  // 1. Rewrite origin and widget_referrer on YouTube embed URLs
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['*://www.youtube.com/embed/*', '*://*.youtube-nocookie.com/embed/*'] },
    (details, callback) => {
      try {
        const parsed = new URL(details.url);
        let modified = false;
        if (parsed.searchParams.has('origin') && parsed.searchParams.get('origin') !== 'https://www.youtube.com') {
          parsed.searchParams.set('origin', 'https://www.youtube.com');
          modified = true;
        }
        if (parsed.searchParams.has('widget_referrer')) {
          parsed.searchParams.set('widget_referrer', 'https://www.youtube.com');
          modified = true;
        }
        if (modified) {
          callback({ redirectURL: parsed.toString() });
          return;
        }
      } catch (e) {}
      callback({});
    }
  );

  // 2. Strip x-frame-options and content-security-policy on YouTube responses
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['*://www.youtube.com/*', '*://*.youtube-nocookie.com/*'] },
    (details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      delete responseHeaders['x-frame-options'];
      delete responseHeaders['X-Frame-Options'];
      delete responseHeaders['content-security-policy'];
      delete responseHeaders['Content-Security-Policy'];
      callback({ responseHeaders });
    }
  );

  // 3. Bypass YouTube embed Referer/Origin/Sec-Fetch security policy in Electron
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://www.youtube.com/*', '*://*.youtube-nocookie.com/*', '*://*.googlevideo.com/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://www.youtube.com/';
      details.requestHeaders['Origin'] = 'https://www.youtube.com';
      if (details.requestHeaders['Sec-Fetch-Site']) {
        details.requestHeaders['Sec-Fetch-Site'] = 'same-origin';
      }
      if (details.requestHeaders['User-Agent']) {
        details.requestHeaders['User-Agent'] = details.requestHeaders['User-Agent'].replace(/Electron\/[0-9\.]+\s?/i, '');
      }
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  // Load client app
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Native IPC handler for selecting files via Windows file dialog
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

// IPC Handler to trigger VLC directly from Electron
ipcMain.handle('launch-vlc', async (_event, mediaPath) => {
  try {
    const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
    const url = `http://localhost:3001/api/vlc/start${mediaPath ? `?path=${encodeURIComponent(mediaPath)}` : ''}`;
    const res = await (global.fetch || fetch)(url);
    const data = await res.json();
    return data;
  } catch (err) {
    return { error: err.message };
  }
});



app.on('ready', async () => {
  await startBackendServer();
  setTimeout(createWindow, 500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
