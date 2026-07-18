const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const MAX_ROOM_SIZE = 6;
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getUserList(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return [];
  const users = [];
  room.users.forEach((user, socketId) => {
    users.push({ socketId, username: user.username, isHost: user.isHost });
  });
  return users;
}

// ── Rate Limiting ──────────────────────────────────────────────
const rateLimits = new Map(); // socketId -> { event -> { count, resetTime } }

function rateLimit(socketId, event, maxPerSecond) {
  const now = Date.now();
  if (!rateLimits.has(socketId)) rateLimits.set(socketId, {});
  const limits = rateLimits.get(socketId);

  if (!limits[event] || now > limits[event].resetTime) {
    limits[event] = { count: 1, resetTime: now + 1000 };
    return false; // Not rate-limited
  }

  limits[event].count++;
  if (limits[event].count > maxPerSecond) {
    return true; // Rate-limited
  }
  return false;
}

io.on('connection', (socket) => {
  console.log(`✦ User connected: ${socket.id}`);

  // ─── Room Management ───────────────────────────────────────────

  socket.on('create-room', ({ username }, callback) => {
    let roomCode = generateRoomCode();
    while (rooms.has(roomCode)) roomCode = generateRoomCode();

    const room = {
      users: new Map(),
      videoSource: null,
      playbackState: { playing: false, currentTime: 0 },
      hostId: socket.id,
      subtitleText: null,
      controlsOpen: false
    };
    room.users.set(socket.id, { username, isHost: true });
    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.roomCode = roomCode;

    callback({ success: true, roomCode, isHost: true });
    io.to(roomCode).emit('room-users', getUserList(roomCode));
    console.log(`✦ Room ${roomCode} created by ${username}`);
  });

  socket.on('join-room', ({ roomCode, username }, callback) => {
    const code = roomCode.toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) return callback({ success: false, error: 'Room not found. Check the code and try again.' });
    if (room.users.size >= MAX_ROOM_SIZE) return callback({ success: false, error: 'Room is full (max 6 people).' });

    room.users.set(socket.id, { username, isHost: false });
    socket.join(code);
    socket.roomCode = code;

    callback({
      success: true,
      roomCode: code,
      isHost: false,
      videoSource: room.videoSource,
      playbackState: room.playbackState,
      hostId: room.hostId,
      subtitleText: room.subtitleText,
      controlsOpen: room.controlsOpen
    });

    io.to(code).emit('room-users', getUserList(code));
    io.to(code).emit('user-joined', { username, socketId: socket.id });
    console.log(`✦ ${username} joined room ${code} (${room.users.size}/${MAX_ROOM_SIZE})`);
  });

  // ─── WebRTC Signaling ──────────────────────────────────────────

  socket.on('webrtc-offer', ({ targetId, offer }) => {
    io.to(targetId).emit('webrtc-offer', { senderId: socket.id, offer });
  });

  socket.on('webrtc-answer', ({ targetId, answer }) => {
    io.to(targetId).emit('webrtc-answer', { senderId: socket.id, answer });
  });

  socket.on('webrtc-ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('webrtc-ice-candidate', { senderId: socket.id, candidate });
  });

  socket.on('request-stream', () => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      io.to(room.hostId).emit('peer-needs-stream', { peerId: socket.id });
    }
  });

  // ─── Playback Synchronization ──────────────────────────────────

  socket.on('sync-play', ({ currentTime }) => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id && !room.controlsOpen) return;
      room.playbackState = { playing: true, currentTime };
      socket.to(socket.roomCode).emit('sync-play', { currentTime });
    }
  });

  socket.on('sync-pause', ({ currentTime }) => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id && !room.controlsOpen) return;
      room.playbackState = { playing: false, currentTime };
      socket.to(socket.roomCode).emit('sync-pause', { currentTime });
    }
  });

  socket.on('sync-seek', ({ currentTime }) => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id && !room.controlsOpen) return;
      if (rateLimit(socket.id, 'sync-seek', 5)) return; // 5/sec max
      room.playbackState.currentTime = currentTime;
      socket.to(socket.roomCode).emit('sync-seek', { currentTime });
    }
  });

  // Periodic heartbeat from host — keeps guests in sync over long sessions
  socket.on('sync-heartbeat', ({ currentTime, playing }) => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id) return; // SECURITY: Only host can heartbeat
      room.playbackState = { playing, currentTime };
      socket.to(socket.roomCode).emit('sync-heartbeat', { currentTime, playing });
    }
  });

  // ─── Manual Re-sync Request ────────────────────────────────────
  // Guest can request the host's exact current time on demand
  socket.on('request-sync', () => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      // Ask the host for their current playback state
      io.to(room.hostId).emit('sync-request-from-guest', { guestId: socket.id });
    }
  });

  // Host responds with their current playback state
  socket.on('sync-response', ({ guestId, currentTime, playing }) => {
    const room = rooms.get(socket.roomCode);
    if (room && room.hostId === socket.id) {
      io.to(guestId).emit('sync-response', { currentTime, playing });
    }
  });

  // ─── Source Management ─────────────────────────────────────────

  socket.on('change-source', ({ sourceType, url }) => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id) return; // SECURITY: Only host can change source
      if (rateLimit(socket.id, 'change-source', 1)) return; // 1/sec max
      room.videoSource = { sourceType, url };
      room.playbackState = { playing: false, currentTime: 0 };
      socket.to(socket.roomCode).emit('source-changed', { sourceType, url });
    }
  });

  // ─── Subtitles ───────────────────────────────────────────────

  socket.on('change-subtitles', ({ subtitleText }) => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id) return; // SECURITY: Only host can set subtitles
      room.subtitleText = subtitleText;
      socket.to(socket.roomCode).emit('subtitles-changed', { subtitleText });
    }
  });

  // ─── Permissions ────────────────────────────────────────────

  socket.on('toggle-permissions', ({ open }) => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id) return; // SECURITY: Only host can toggle
      room.controlsOpen = !!open;
      io.to(socket.roomCode).emit('permissions-changed', { controlsOpen: room.controlsOpen });
      console.log(`✦ Room ${socket.roomCode} controls ${room.controlsOpen ? 'opened' : 'locked'}`);
    }
  });

  // ─── Chat ──────────────────────────────────────────────────────

  socket.on('chat-message', ({ message }) => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      if (rateLimit(socket.id, 'chat-message', 3)) return; // 3/sec max
      const user = room.users.get(socket.id);
      io.to(socket.roomCode).emit('chat-message', {
        username: user?.username || 'Unknown',
        message,
        timestamp: Date.now(),
        senderId: socket.id
      });
    }
  });

  // ─── Disconnect ────────────────────────────────────────────────

  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const user = room.users.get(socket.id);
    room.users.delete(socket.id);

    if (room.users.size === 0) {
      rooms.delete(roomCode);
      console.log(`✦ Room ${roomCode} dissolved (empty)`);
    } else {
      if (room.hostId === socket.id) {
        const newHostId = room.users.keys().next().value;
        room.hostId = newHostId;
        const newHost = room.users.get(newHostId);
        if (newHost) newHost.isHost = true;
        io.to(roomCode).emit('host-changed', { newHostId });
        console.log(`✦ Host migrated to ${newHost?.username} in room ${roomCode}`);

        // If the disconnected host was streaming a local file, clear it
        // (the blob: URL is dead since it belonged to the original host's browser)
        if (room.videoSource && room.videoSource.sourceType === 'file') {
          room.videoSource = null;
          room.playbackState = { playing: false, currentTime: 0 };
          io.to(roomCode).emit('source-changed', { sourceType: null, url: null });
          console.log(`✦ Cleared dead file source in room ${roomCode} after host migration`);
        }
      }
      io.to(roomCode).emit('room-users', getUserList(roomCode));
      io.to(roomCode).emit('user-left', { username: user?.username, socketId: socket.id });
    }
    console.log(`✦ User disconnected: ${socket.id}`);
  });
});

// ─── Health Check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'SyncStream server is running',
    activeRooms: rooms.size,
    maxRoomSize: MAX_ROOM_SIZE
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n  ✦ SyncStream Server`);
  console.log(`  ✦ Running on http://localhost:${PORT}`);
  console.log(`  ✦ Max room capacity: ${MAX_ROOM_SIZE} users\n`);
});
