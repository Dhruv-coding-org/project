const roomManager = require('../services/roomManager');
const rateLimiter = require('../services/rateLimiter');

function registerChatHandlers(io, socket) {
  socket.on('change-source', ({ sourceType, url }) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id) return; // Security: host only
      if (rateLimiter.isRateLimited(socket.id, 'change-source', 1)) return;

      room.videoSource = { sourceType, url };
      room.playbackState = { playing: false, currentTime: 0 };
      socket.to(socket.roomCode).emit('source-changed', { sourceType, url });
    }
  });

  socket.on('change-subtitles', ({ subtitleText }) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id) return;
      room.subtitleText = subtitleText;
      socket.to(socket.roomCode).emit('subtitles-changed', { subtitleText });
    }
  });

  socket.on('toggle-permissions', ({ open }) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id) return;
      room.controlsOpen = !!open;
      io.to(socket.roomCode).emit('permissions-changed', { controlsOpen: room.controlsOpen });
      console.log(`✦ Room ${socket.roomCode} controls ${room.controlsOpen ? 'opened' : 'locked'}`);
    }
  });

  socket.on('chat-message', ({ message }) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room) {
      if (rateLimiter.isRateLimited(socket.id, 'chat-message', 3)) return;
      const user = room.users.get(socket.id);
      io.to(socket.roomCode).emit('chat-message', {
        username: user?.username || 'Unknown',
        message,
        timestamp: Date.now(),
        senderId: socket.id
      });
    }
  });
}

module.exports = registerChatHandlers;
