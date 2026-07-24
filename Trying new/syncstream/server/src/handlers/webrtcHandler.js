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
}

module.exports = registerWebRTCHandlers;
