const roomManager = require('../services/roomManager');
const rateLimiter = require('../services/rateLimiter');

function registerRoomHandlers(io, socket) {
  socket.on('create-room', ({ username, avatar, statusMessage }, callback) => {
    const { roomCode } = roomManager.createRoom(socket.id, username, avatar, statusMessage);
    socket.join(roomCode);
    socket.roomCode = roomCode;

    if (typeof callback === 'function') {
      callback({ success: true, roomCode, isHost: true });
    }
    io.to(roomCode).emit('room-users', roomManager.getUserList(roomCode));
    console.log(`✦ Room ${roomCode} created by ${username}`);
  });

  socket.on('join-room', ({ roomCode, username, avatar, statusMessage }, callback) => {
    const result = roomManager.joinRoom(roomCode, socket.id, username, avatar, statusMessage);
    if (!result.success) {
      if (typeof callback === 'function') callback({ success: false, error: result.error });
      return;
    }

    const { roomCode: code, room } = result;
    socket.join(code);
    socket.roomCode = code;

    if (typeof callback === 'function') {
      callback({
        success: true,
        roomCode: code,
        isHost: false,
        videoSource: room.videoSource,
        playbackState: room.playbackState,
        hostId: room.hostId,
        subtitleText: room.subtitleText,
        controlsOpen: room.controlsOpen,
        playlist: room.playlist
      });
    }

    io.to(code).emit('room-users', roomManager.getUserList(code));
    io.to(code).emit('user-joined', { username, socketId: socket.id });
    console.log(`✦ ${username} joined room ${code}`);
  });

  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    // Clean up memory leaks in rate limiter
    rateLimiter.cleanup(socket.id);

    if (!roomCode) return;

    const res = roomManager.handleDisconnect(socket.id, roomCode);
    if (!res) return;

    if (res.dissolved) {
      console.log(`✦ Room ${roomCode} dissolved (empty)`);
    } else {
      if (res.newHostId) {
        const room = roomManager.getRoom(roomCode);
        const newHost = room ? room.users.get(res.newHostId) : null;
        const hostUsername = newHost ? newHost.username : 'Unknown';
        io.to(roomCode).emit('host-changed', { hostId: res.newHostId, hostUsername });
        console.log(`✦ Host migrated in room ${roomCode} to ${hostUsername}`);
        if (res.clearedSource) {
          io.to(roomCode).emit('source-changed', { sourceType: null, url: null });
        }
      }
      io.to(roomCode).emit('room-users', res.userList);
      io.to(roomCode).emit('user-left', { username: res.username, socketId: socket.id });
    }
    console.log(`✦ User disconnected: ${socket.id}`);
  });

  socket.on('update-profile', ({ username, avatar, statusMessage }) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room) {
      const user = room.users.get(socket.id);
      if (user) {
        if (username) user.username = username;
        if (avatar) user.avatar = avatar;
        if (statusMessage !== undefined) user.statusMessage = statusMessage;
        io.to(socket.roomCode).emit('room-users', roomManager.getUserList(socket.roomCode));
      }
    }
  });
}

module.exports = registerRoomHandlers;
