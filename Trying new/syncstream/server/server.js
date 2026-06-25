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
      hostId: socket.id
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
      hostId: room.hostId
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
      if (room.hostId !== socket.id) return; // SECURITY: Only host can sync
      room.playbackState = { playing: true, currentTime };
      socket.to(socket.roomCode).emit('sync-play', { currentTime });
    }
  });

  socket.on('sync-pause', ({ currentTime }) => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id) return; // SECURITY: Only host can sync
      room.playbackState = { playing: false, currentTime };
      socket.to(socket.roomCode).emit('sync-pause', { currentTime });
    }
  });

  socket.on('sync-seek', ({ currentTime }) => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id) return; // SECURITY: Only host can sync
      room.playbackState.currentTime = currentTime;
      socket.to(socket.roomCode).emit('sync-seek', { currentTime });
    }
  });

  // ─── Source Management ─────────────────────────────────────────

  socket.on('change-source', ({ sourceType, url }) => {
    const room = rooms.get(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id) return; // SECURITY: Only host can change source
      room.videoSource = { sourceType, url };
      room.playbackState = { playing: false, currentTime: 0 };
      socket.to(socket.roomCode).emit('source-changed', { sourceType, url });
    }
  });

  // ─── Chat ──────────────────────────────────────────────────────

  socket.on('chat-message', ({ message }) => {
    const room = rooms.get(socket.roomCode);
    if (room) {
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
