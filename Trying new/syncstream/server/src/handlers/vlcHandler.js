const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

let vlcProcess = null;
const VLC_PORT = 8080;
const VLC_PASS = 'syncstream';

// Locate VLC on Windows
function findVlc() {
  const possiblePaths = [
    'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
    'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe'
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Request helper for VLC HTTP API
function vlcRequest(command, extraParams = '') {
  return new Promise((resolve, reject) => {
    let pathStr = `/requests/status.json`;
    if (command) {
      pathStr += `?command=${command}${extraParams}`;
    }

    const options = {
      hostname: 'localhost',
      port: VLC_PORT,
      path: pathStr,
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`:${VLC_PASS}`).toString('base64')
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

function handleVlcStart(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const rawPath = req.query.path;
  if (!rawPath) return res.status(400).json({ error: 'Missing path' });

  const filePath = decodeURIComponent(rawPath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  const vlcExe = findVlc();
  if (!vlcExe) {
    return res.status(500).json({ error: 'VLC Media Player not found on system. Please install VLC.' });
  }

  // Kill existing VLC if any
  if (vlcProcess) {
    try {
      vlcProcess.kill();
    } catch(e) {}
  }

  // Launch VLC with HTTP interface
  vlcProcess = spawn(vlcExe, [
    '--extraintf', 'http',
    '--http-password', VLC_PASS,
    '--http-port', VLC_PORT.toString(),
    '--play-and-pause',
    filePath
  ], {
    detached: true,
    stdio: 'ignore'
  });
  vlcProcess.unref();

  res.json({ success: true, message: 'VLC launched successfully' });
}

async function handleVlcStatus(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const status = await vlcRequest();
    if (!status) return res.status(500).json({ error: 'Failed to parse VLC status' });
    
    res.json({
      time: status.time,          // current time in seconds
      length: status.length,      // total length in seconds
      state: status.state,        // 'playing', 'paused', 'stopped'
      position: status.position,  // 0.0 to 1.0
      volume: status.volume
    });
  } catch (err) {
    res.status(500).json({ error: 'VLC not reachable' });
  }
}

async function handleVlcCommand(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const cmd = req.query.command; // 'pl_play', 'pl_pause', 'pl_forcepause', 'seek'
  const val = req.query.val; // used for seek (e.g. seconds)
  
  try {
    let extra = '';
    if (val) extra = `&val=${val}`;
    
    await vlcRequest(cmd, extra);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'VLC command failed' });
  }
}

function handleVlcCheck(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const vlcExe = findVlc();
  res.json({ installed: !!vlcExe });
}

module.exports = {
  handleVlcStart,
  handleVlcStatus,
  handleVlcCommand,
  handleVlcCheck
};
