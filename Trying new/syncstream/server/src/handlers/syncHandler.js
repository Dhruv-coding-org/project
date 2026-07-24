const roomManager = require('../services/roomManager');
const rateLimiter = require('../services/rateLimiter');

function registerSyncHandlers(io, socket) {
  // Latency calculation helper
  socket.on('ping-rtt', (clientTime, callback) => {
    if (typeof callback === 'function') {
      callback({ clientTime, serverTime: Date.now() });
    }
  });

  socket.on('sync-play', ({ currentTime }) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (!room) return;
    if (room.hostId !== socket.id && !room.controlsOpen) return;

    const serverTimestamp = Date.now();
    room.playbackState = { playing: true, currentTime };
    socket.to(socket.roomCode).emit('sync-play', { currentTime, serverTimestamp });
  });

  socket.on('sync-pause', ({ currentTime }) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (!room) return;
    if (room.hostId !== socket.id && !room.controlsOpen) return;

    const serverTimestamp = Date.now();
    room.playbackState = { playing: false, currentTime };
    socket.to(socket.roomCode).emit('sync-pause', { currentTime, serverTimestamp });
  });

  socket.on('sync-seek', ({ currentTime }) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (!room) return;
    if (room.hostId !== socket.id && !room.controlsOpen) return;
    if (rateLimiter.isRateLimited(socket.id, 'sync-seek', 5)) return;

    const serverTimestamp = Date.now();
    room.playbackState.currentTime = currentTime;
    socket.to(socket.roomCode).emit('sync-seek', { currentTime, serverTimestamp });
  });

  socket.on('sync-heartbeat', ({ currentTime, playing }) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (!room) return;
    if (room.hostId !== socket.id) return; // Security: Only host sends periodic heartbeats

    const serverTimestamp = Date.now();
    room.playbackState = { playing, currentTime };
    socket.to(socket.roomCode).emit('sync-heartbeat', { currentTime, playing, serverTimestamp });
  });

  socket.on('request-sync', () => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room) {
      io.to(room.hostId).emit('sync-request-from-guest', { guestId: socket.id });
    }
  });

  socket.on('sync-response', ({ guestId, currentTime, playing }) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room && room.hostId === socket.id) {
      const serverTimestamp = Date.now();
      io.to(guestId).emit('sync-response', { currentTime, playing, serverTimestamp });
    }
  });
}

module.exports = registerSyncHandlers;
