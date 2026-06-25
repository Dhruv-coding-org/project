import { useState, useEffect, useCallback } from 'react';
import { socket } from '../socket';

export interface RoomUser {
  socketId: string;
  username: string;
  isHost: boolean;
}

export interface VideoSource {
  sourceType: 'url' | 'file';
  url: string;
}

export interface PlaybackState {
  playing: boolean;
  currentTime: number;
}

export interface RoomState {
  roomCode: string | null;
  username: string;
  isHost: boolean;
  users: RoomUser[];
  hostId: string | null;
  videoSource: VideoSource | null;
  playbackState: PlaybackState;
  chatMessages: ChatMessage[];
  connected: boolean;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  senderId: string;
  isMine: boolean;
}

interface CreateRoomOptions { username: string; }
interface JoinRoomOptions   { username: string; roomCode: string; }

export function useRoom() {
  const [state, setState] = useState<RoomState>({
    roomCode: null,
    username: '',
    isHost: false,
    users: [],
    hostId: null,
    videoSource: null,
    playbackState: { playing: false, currentTime: 0 },
    chatMessages: [],
    connected: false,
    error: null,
  });

  // ── Socket event listeners ──────────────────────────────────────────
  useEffect(() => {
    socket.on('connect', () => setState(s => ({ ...s, connected: true, error: null })));
    socket.on('disconnect', () => setState(s => ({ ...s, connected: false })));

    socket.on('room-users', (users: RoomUser[]) => {
      setState(s => ({ ...s, users }));
    });

    socket.on('user-joined', ({ username }: { username: string }) => {
      addSystemMessage(`${username} joined the room`);
    });

    socket.on('user-left', ({ username }: { username: string }) => {
      addSystemMessage(`${username} left the room`);
    });

    socket.on('host-changed', ({ newHostId }: { newHostId: string }) => {
      setState(s => ({
        ...s,
        hostId: newHostId,
        isHost: socket.id === newHostId,
        users: s.users.map(u => ({ ...u, isHost: u.socketId === newHostId })),
      }));
      addSystemMessage('Host has changed');
    });

    socket.on('source-changed', (source: VideoSource) => {
      setState(s => ({
        ...s,
        videoSource: source,
        playbackState: { playing: false, currentTime: 0 },
      }));
    });

    socket.on('chat-message', (msg: Omit<ChatMessage, 'id' | 'isMine'>) => {
      setState(s => ({
        ...s,
        chatMessages: [...s.chatMessages, {
          ...msg,
          id: `${msg.timestamp}-${msg.senderId}`,
          isMine: msg.senderId === socket.id,
        }],
      }));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('host-changed');
      socket.off('source-changed');
      socket.off('chat-message');
    };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────
  const addSystemMessage = (message: string) => {
    setState(s => ({
      ...s,
      chatMessages: [...s.chatMessages, {
        id: `sys-${Date.now()}`,
        username: 'System',
        message,
        timestamp: Date.now(),
        senderId: 'system',
        isMine: false,
      }],
    }));
  };

  // ── Actions ─────────────────────────────────────────────────────────
  const createRoom = useCallback(({ username }: CreateRoomOptions): Promise<string> => {
    return new Promise((resolve, reject) => {
      socket.connect();
      socket.emit('create-room', { username }, (res: { success: boolean; roomCode?: string; error?: string }) => {
        if (res.success && res.roomCode) {
          setState(s => ({
            ...s,
            roomCode: res.roomCode!,
            username,
            isHost: true,
            hostId: socket.id ?? null,
            error: null,
          }));
          resolve(res.roomCode);
        } else {
          reject(new Error(res.error || 'Failed to create room'));
        }
      });
    });
  }, []);

  const joinRoom = useCallback(({ username, roomCode }: JoinRoomOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
      socket.connect();
      socket.emit('join-room', { username, roomCode }, (res: {
        success: boolean;
        roomCode?: string;
        isHost?: boolean;
        videoSource?: VideoSource;
        playbackState?: PlaybackState;
        hostId?: string;
        error?: string;
      }) => {
        if (res.success) {
          setState(s => ({
            ...s,
            roomCode: res.roomCode!,
            username,
            isHost: false,
            hostId: res.hostId ?? null,
            videoSource: res.videoSource ?? null,
            playbackState: res.playbackState ?? { playing: false, currentTime: 0 },
            error: null,
          }));
          resolve();
        } else {
          socket.disconnect();
          reject(new Error(res.error || 'Failed to join room'));
        }
      });
    });
  }, []);

  const leaveRoom = useCallback(() => {
    socket.disconnect();
    setState({
      roomCode: null,
      username: '',
      isHost: false,
      users: [],
      hostId: null,
      videoSource: null,
      playbackState: { playing: false, currentTime: 0 },
      chatMessages: [],
      connected: false,
      error: null,
    });
  }, []);

  const sendChat = useCallback((message: string) => {
    socket.emit('chat-message', { message });
  }, []);

  const changeSource = useCallback((source: VideoSource) => {
    socket.emit('change-source', source);
    setState(s => ({ ...s, videoSource: source, playbackState: { playing: false, currentTime: 0 } }));
  }, []);

  const emitPlay  = useCallback((currentTime: number) => socket.emit('sync-play',  { currentTime }), []);
  const emitPause = useCallback((currentTime: number) => socket.emit('sync-pause', { currentTime }), []);
  const emitSeek  = useCallback((currentTime: number) => socket.emit('sync-seek',  { currentTime }), []);

  return {
    state,
    createRoom,
    joinRoom,
    leaveRoom,
    sendChat,
    changeSource,
    emitPlay,
    emitPause,
    emitSeek,
  };
}
