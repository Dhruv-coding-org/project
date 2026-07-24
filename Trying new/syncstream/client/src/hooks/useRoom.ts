import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../socket';
import type {
  RoomUser,
  VideoSource,
  PlaybackState,
  RoomState,
  ChatMessage
} from '../types';

export type { RoomUser, VideoSource, PlaybackState, RoomState, ChatMessage } from '../types';

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
    subtitleText: null,
    controlsOpen: false,
  });

  const rttRef = useRef<number>(0);

  // Measure round trip latency (RTT) every 10s for timestamp offset compensation
  useEffect(() => {
    if (!state.connected || !state.roomCode) return;

    const measureRtt = () => {
      const start = Date.now();
      socket.emit('ping-rtt', start, (res: { clientTime: number; serverTime: number }) => {
        if (res && res.clientTime) {
          const rtt = Date.now() - res.clientTime;
          rttRef.current = rtt;
        }
      });
    };

    measureRtt();
    const interval = setInterval(measureRtt, 10000);
    return () => clearInterval(interval);
  }, [state.connected, state.roomCode]);

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

    socket.on('subtitles-changed', ({ subtitleText }: { subtitleText: string | null }) => {
      setState(s => ({ ...s, subtitleText }));
    });

    socket.on('permissions-changed', ({ controlsOpen }: { controlsOpen: boolean }) => {
      setState(s => ({ ...s, controlsOpen }));
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

    socket.on('sync-request-from-guest', ({ guestId }: { guestId: string }) => {
      window.dispatchEvent(new CustomEvent('sync-request-from-guest', { detail: { guestId } }));
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
      socket.off('sync-request-from-guest');
      socket.off('subtitles-changed');
      socket.off('permissions-changed');
    };
  }, []);

  const createRoom = useCallback(({ username }: { username: string }): Promise<string> => {
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

  const joinRoom = useCallback(({ username, roomCode }: { username: string; roomCode: string }): Promise<void> => {
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
        subtitleText?: string | null;
        controlsOpen?: boolean;
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
            subtitleText: res.subtitleText ?? null,
            controlsOpen: res.controlsOpen ?? false,
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
      subtitleText: null,
      controlsOpen: false,
    });
  }, []);

  const sendChat = useCallback((message: string) => {
    socket.emit('chat-message', { message });
  }, []);

  const changeSource = useCallback((source: VideoSource) => {
    socket.emit('change-source', source);
    setState(s => ({ ...s, videoSource: source, playbackState: { playing: false, currentTime: 0 } }));
  }, []);

  const changeSubtitles = useCallback((subtitleText: string | null) => {
    socket.emit('change-subtitles', { subtitleText });
    setState(s => ({ ...s, subtitleText }));
  }, []);

  const togglePermissions = useCallback((open: boolean) => {
    socket.emit('toggle-permissions', { open });
    setState(s => ({ ...s, controlsOpen: open }));
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
    changeSubtitles,
    togglePermissions,
    emitPlay,
    emitPause,
    emitSeek,
    rttRef
  };
}
