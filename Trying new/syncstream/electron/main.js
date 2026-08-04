const { app, BrowserWindow, dialog, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');
const net = require('net');

let mainWindow;
let vlcProcess = null;
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

function getVlcPath() {
  const commonPaths = [
    'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe',
    'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'vlc';
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

  // Bypass YouTube embed Referer/Origin security policy in Electron file:// protocol
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://www.youtube.com/*', 'https://*.youtube-nocookie.com/*', 'https://*.googlevideo.com/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://www.youtube.com/';
      details.requestHeaders['Origin'] = 'https://www.youtube.com';
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

// IPC Handler: Detect system VLC installation
ipcMain.handle('detect-vlc', async () => {
  const vlcPath = getVlcPath();
  const installed = vlcPath !== 'vlc';
  return { installed, vlcPath };
});

// IPC Handler: Launch System VLC Media Player with HTTP interface enabled
// streamUrl can be either:
//   - A local file path (e.g. C:\Movies\video.mkv)
//   - An http:// stream URL from our embedded server
//   - Or a full stream URL that wraps a local file path
ipcMain.handle('launch-vlc', async (event, { streamUrl, filePath, title }) => {
  const vlcPath = getVlcPath();

  // Resolve the actual media path for VLC:
  // If filePath is passed directly, use it. Otherwise try to decode path from stream URL.
  let mediaTarget = filePath || streamUrl;

  if (!filePath && streamUrl && streamUrl.includes('localhost:3001/api/stream')) {
    try {
      const urlObj = new URL(streamUrl);
      const rawPath = urlObj.searchParams.get('path');
      if (rawPath) {
        // Decode the path (may be encoded twice due to URL embedding)
        let decoded = decodeURIComponent(rawPath);
        // If still a URL (double-encoded), decode again
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
          const inner = new URL(decoded);
          const innerPath = inner.searchParams.get('path');
          if (innerPath) decoded = decodeURIComponent(innerPath);
        }
        mediaTarget = decoded;
      }
    } catch (e) {
      console.warn('[Electron] Failed to parse streamUrl for VLC:', e.message);
      mediaTarget = streamUrl;
    }
  }

  console.log('[Electron] Launching System VLC with media target:', mediaTarget);

  const args = [
    mediaTarget,
    '--extraintf=http',
    '--http-port=8080',
    '--http-password=syncstream',
    `--meta-title=SyncStream - ${title || 'Watch Party'}`,
  ];

  if (vlcProcess) {
    try { vlcProcess.kill(); } catch (e) {}
  }

  vlcProcess = spawn(vlcPath, args, { detached: true, stdio: 'ignore' });
  vlcProcess.unref();

  return { success: true, message: 'VLC Launched', target: mediaTarget };
});

// IPC Handler: Send command to VLC HTTP interface
ipcMain.handle('vlc-command', async (event, { command, val }) => {
  return new Promise((resolve) => {
    let url = `http://localhost:8080/requests/status.json?command=${command}`;
    if (val !== undefined && val !== null) {
      url += `&val=${encodeURIComponent(val)}`;
    }

    const auth = Buffer.from(':syncstream').toString('base64');
    const req = http.get(url, {
      headers: { 'Authorization': `Basic ${auth}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ success: true, status: JSON.parse(data) });
        } catch (e) {
          resolve({ success: true, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
});

app.on('ready', async () => {
  await startBackendServer();
  setTimeout(createWindow, 500);
});

app.on('window-all-closed', () => {
  if (vlcProcess) {
    try { vlcProcess.kill(); } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
