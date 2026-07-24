const roomManager = require('../services/roomManager');

function registerWebRTCHandlers(io, socket) {
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
    const room = roomManager.getRoom(socket.roomCode);
    if (room) {
      io.to(room.hostId).emit('peer-needs-stream', { peerId: socket.id });
    }
  });

  // Voice Chat WebRTC Signaling
  socket.on('voice-offer', ({ targetId, offer }) => {
    io.to(targetId).emit('voice-offer', { senderId: socket.id, offer });
  });

  socket.on('voice-answer', ({ targetId, answer }) => {
    io.to(targetId).emit('voice-answer', { senderId: socket.id, answer });
  });

  socket.on('voice-ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('voice-ice-candidate', { senderId: socket.id, candidate });
  });

  socket.on('voice-status-change', ({ isMuted, isDeafened }) => {
    socket.to(socket.roomCode).emit('voice-status-changed', {
      socketId: socket.id,
      isMuted,
      isDeafened
    });
  });
}

module.exports = registerWebRTCHandlers;
