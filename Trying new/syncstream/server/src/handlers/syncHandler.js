const roomManager = require('../services/roomManager');
const rateLimiter = require('../services/rateLimiter');

function registerSyncHandlers(io, socket) {
  socket.on('ping-rtt', (clientTime, callback) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room && clientTime) {
      const user = room.users.get(socket.id);
      if (user) {
        const rtt = Math.max(1, Math.round(Date.now() - clientTime));
        const oldPing = user.ping || 0;
        user.ping = rtt;
        if (Math.abs(rtt - oldPing) > 15) {
          io.to(socket.roomCode).emit('room-users', roomManager.getUserList(socket.roomCode));
        }
      }
    }
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

  // Reaction events
  socket.on('send-reaction', ({ emoji }) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room) {
      const user = room.users.get(socket.id);
      io.to(socket.roomCode).emit('reaction-received', {
        id: `react-${Date.now()}-${Math.random()}`,
        emoji,
        username: user?.username || 'Guest',
        senderId: socket.id
      });
    }
  });

  // Playlist management
  const handlePlaylistUpdate = (playlistData) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room) {
      if (room.hostId !== socket.id && !room.controlsOpen) return;
      const playlist = Array.isArray(playlistData)
        ? playlistData
        : (playlistData?.playlist && Array.isArray(playlistData.playlist) ? playlistData.playlist : []);
      room.playlist = playlist;
      io.to(socket.roomCode).emit('playlist-changed', { playlist: room.playlist });
    }
  };

  socket.on('playlist-update', (data) => handlePlaylistUpdate(data?.playlist || data));
  socket.on('update-playlist', (data) => handlePlaylistUpdate(data?.playlist || data));

  socket.on('playlist-next', () => {
    const room = roomManager.getRoom(socket.roomCode);
    if (room && room.playlist && room.playlist.length > 0) {
      if (room.hostId !== socket.id && !room.controlsOpen) return;

      const now = Date.now();
      if (room._lastPlaylistNextTime && now - room._lastPlaylistNextTime < 2500) return;
      room._lastPlaylistNextTime = now;

      const nextSource = room.playlist.shift();
      room.videoSource = nextSource;
      room.playbackState = { playing: true, currentTime: 0 };
      room.subtitleText = null;

      io.to(socket.roomCode).emit('playlist-changed', { playlist: room.playlist });
      io.to(socket.roomCode).emit('source-changed', nextSource);
      io.to(socket.roomCode).emit('subtitles-changed', null);
      io.to(socket.roomCode).emit('playback-sync', room.playbackState);
      io.to(socket.roomCode).emit('sync-play', { currentTime: 0 });
      console.log(`✦ Room ${socket.roomCode} auto-advanced to next playlist video:`, nextSource?.title || nextSource?.url);
    }
  });
  socket.on('change-source', (source) => {
    const room = roomManager.getRoom(socket.roomCode);
    if (!room) return;
    if (room.hostId !== socket.id && !room.controlsOpen) return;

    room.videoSource = source;
    room.playbackState = { playing: false, currentTime: 0 };
    io.to(socket.roomCode).emit('source-changed', source);
    console.log(`✦ Source changed in room ${socket.roomCode}:`, source?.title || source?.url);
  });
}

module.exports = registerSyncHandlers;
