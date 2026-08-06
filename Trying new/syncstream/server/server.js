const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { MAX_ROOM_SIZE, PORT } = require('./src/config/constants');
const roomManager = require('./src/services/roomManager');
const registerRoomHandlers = require('./src/handlers/roomHandler');
const registerSyncHandlers = require('./src/handlers/syncHandler');
const registerWebRTCHandlers = require('./src/handlers/webrtcHandler');
const registerChatHandlers = require('./src/handlers/chatHandler');

const { handleStreamRequest, handleStreamHealth, handleMediaInfo, handleSubtitleExtract } = require('./src/handlers/streamHandler');
const { handleVlcStart, handleVlcStatus, handleVlcCommand, handleVlcCheck } = require('./src/handlers/vlcHandler');

const app = express();
app.use(cors());

// Local HTTP Range Request Streaming Endpoint (0-RAM 4GB+ File Support)
app.get('/api/stream', handleStreamRequest);
app.get('/api/stream/health', handleStreamHealth);
app.get('/api/media-info', handleMediaInfo);
app.get('/api/subtitle/extract', handleSubtitleExtract);

// VLC Integration
app.post('/api/vlc/start', handleVlcStart);
app.get('/api/vlc/status', handleVlcStatus);
app.post('/api/vlc/command', handleVlcCommand);
app.get('/api/vlc/check', handleVlcCheck);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  console.log(`✦ User connected: ${socket.id}`);

  registerRoomHandlers(io, socket);
  registerSyncHandlers(io, socket);
  registerWebRTCHandlers(io, socket);
  registerChatHandlers(io, socket);
});

// ─── Health Check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'SyncStream server is running',
    activeRooms: roomManager.rooms.size,
    maxRoomSize: MAX_ROOM_SIZE
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`[Server] Port ${PORT} is already in use. Assuming server is already running.`);
  } else {
    console.error('[Server] Error:', e);
  }
});

const localtunnel = require('localtunnel');

server.listen(PORT, async () => {
  console.log(`\n  ✦ SyncStream Server`);
  console.log(`  ✦ Running on http://localhost:${PORT}`);
  console.log(`  ✦ Max room capacity: ${MAX_ROOM_SIZE} users`);

  try {
    const fs = require('fs');
    const path = require('path');
    const tunnelConfigFile = path.join(__dirname, 'syncstream_tunnel.json');
    let subdomain = '';
    
    if (fs.existsSync(tunnelConfigFile)) {
      const config = JSON.parse(fs.readFileSync(tunnelConfigFile, 'utf8'));
      subdomain = config.subdomain;
    } else {
      subdomain = `syncstream-${Math.random().toString(36).substring(2, 10)}`;
      fs.writeFileSync(tunnelConfigFile, JSON.stringify({ subdomain }));
    }

    const tunnel = await localtunnel({ port: PORT, subdomain });
    console.log(`\n  ======================================================`);
    console.log(`  🌐 PUBLIC SYNCSTREAM TUNNEL URL`);
    console.log(`  Use this URL to connect your mobile app/APK on the go:`);
    console.log(`  >> ${tunnel.url} <<`);
    console.log(`  ======================================================\n`);
  } catch (err) {
    console.warn(`  [Warning] Failed to start localtunnel: ${err.message}`);
  }
});
