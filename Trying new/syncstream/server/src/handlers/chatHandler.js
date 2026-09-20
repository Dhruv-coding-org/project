const roomManager = require('../services/roomManager');
const rateLimiter = require('../services/rateLimiter');

function registerChatHandlers(io, socket) {
  socket.on('change-subtitles', (data) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id && !room.controlsOpen) return;
      const subtitleText = typeof data === 'object' && data !== null ? data.subtitleText : data;
      room.subtitleText = subtitleText || null;
      io.to(socket.roomCode).emit('subtitles-changed', subtitleText || null);
      console.log(`✦ Subtitles updated in room ${socket.roomCode} by ${socket.id}:`, subtitleText ? 'Loaded' : 'Cleared');
    }
  });

  socket.on('toggle-permissions', (data) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id) return;
      const open = typeof data === 'object' && data !== null ? !!data.open : !!data;
      room.controlsOpen = open;
      io.to(socket.roomCode).emit('permissions-changed', { open: room.controlsOpen });
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
