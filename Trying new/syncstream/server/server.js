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

const { handleStreamRequest, handleStreamHealth } = require('./src/handlers/streamHandler');

const app = express();
app.use(cors());

// Local HTTP Range Request Streaming Endpoint (0-RAM 4GB+ File Support)
app.get('/api/stream', handleStreamRequest);
app.get('/api/stream/health', handleStreamHealth);

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

server.listen(PORT, () => {
  console.log(`\n  ✦ SyncStream Server`);
  console.log(`  ✦ Running on http://localhost:${PORT}`);
  console.log(`  ✦ Max room capacity: ${MAX_ROOM_SIZE} users\n`);
});
