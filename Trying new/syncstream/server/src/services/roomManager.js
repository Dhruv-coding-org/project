const { MAX_ROOM_SIZE } = require('../config/constants');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  getUserList(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    const users = [];
    room.users.forEach((user, socketId) => {
      users.push({ socketId, username: user.username, isHost: user.isHost });
    });
    return users;
  }

  createRoom(socketId, username) {
    let roomCode = this.generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = this.generateRoomCode();
    }

    const room = {
      users: new Map(),
      videoSource: null,
      playbackState: { playing: false, currentTime: 0 },
      hostId: socketId,
      subtitleText: null,
      controlsOpen: false
    };
    room.users.set(socketId, { username, isHost: true });
    this.rooms.set(roomCode, room);

    return { roomCode, room };
  }

  joinRoom(roomCode, socketId, username) {
    const code = roomCode.toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: 'Room not found. Check the code and try again.' };
    }
    if (room.users.size >= MAX_ROOM_SIZE) {
      return { success: false, error: 'Room is full (max 6 people).' };
    }

    room.users.set(socketId, { username, isHost: false });
    return {
      success: true,
      roomCode: code,
      room
    };
  }

  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode);
  }

  handleDisconnect(socketId, roomCode) {
    if (!roomCode) return null;
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const user = room.users.get(socketId);
    room.users.delete(socketId);

    if (room.users.size === 0) {
      this.rooms.delete(roomCode);
      return { dissolved: true, roomCode };
    }

    let newHostId = null;
    let clearedSource = false;

    if (room.hostId === socketId) {
      newHostId = room.users.keys().next().value;
      room.hostId = newHostId;
      const newHost = room.users.get(newHostId);
      if (newHost) newHost.isHost = true;

      // If disconnected host was streaming local file, reset dead stream source
      if (room.videoSource && room.videoSource.sourceType === 'file') {
        room.videoSource = null;
        room.playbackState = { playing: false, currentTime: 0 };
        clearedSource = true;
      }
    }

    return {
      dissolved: false,
      roomCode,
      username: user ? user.username : 'Unknown',
      newHostId,
      clearedSource,
      userList: this.getUserList(roomCode)
    };
  }
}

module.exports = new RoomManager();
