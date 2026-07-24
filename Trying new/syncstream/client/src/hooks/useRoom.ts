import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../socket';
import type {
  RoomUser,
  VideoSource,
  PlaybackState,
  RoomState,
  ChatMessage,
  EmojiReaction,
  UserProfile
} from '../types';

export type { RoomUser, VideoSource, PlaybackState, RoomState, ChatMessage, EmojiReaction, UserProfile } from '../types';

export function getSavedProfile(): UserProfile {
  try {
    const raw = localStorage.getItem('syncstream_user_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        username: parsed.username || '',
        avatar: parsed.avatar || '🍿',
        statusMessage: parsed.statusMessage || ''
      };
    }
  } catch { /* ignore */ }
  return { username: '', avatar: '🍿', statusMessage: '' };
}

export function saveProfileToStorage(profile: UserProfile) {
  try {
    localStorage.setItem('syncstream_user_profile', JSON.stringify(profile));
  } catch { /* ignore */ }
}

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
    playlist: [],
    activeReactions: [],
  });

  const rttRef = useRef<number>(0);

  // Measure round trip latency (RTT) every 3 seconds for real-time ping meters
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
    const interval = setInterval(measureRtt, 3000);
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

    socket.on('reaction-received', (reaction: EmojiReaction) => {
      setState(s => ({
        ...s,
        activeReactions: [...s.activeReactions, reaction]
      }));
      setTimeout(() => {
        setState(s => ({
          ...s,
          activeReactions: s.activeReactions.filter(r => r.id !== reaction.id)
        }));
      }, 3000);
    });

    socket.on('playlist-changed', ({ playlist }: { playlist: VideoSource[] }) => {
      setState(s => ({ ...s, playlist: playlist || [] }));
    });

    socket.on('voice-status-changed', ({ socketId, isMuted, isDeafened }: { socketId: string; isMuted: boolean; isDeafened: boolean }) => {
      setState(s => ({
        ...s,
        users: s.users.map(u => u.socketId === socketId ? { ...u, isMuted, isDeafened } : u)
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
      socket.off('subtitles-changed');
      socket.off('permissions-changed');
      socket.off('chat-message');
      socket.off('reaction-received');
      socket.off('playlist-changed');
      socket.off('voice-status-changed');
      socket.off('sync-request-from-guest');
    };
  }, []);

  const createRoom = useCallback(({ username, avatar = '🍿', statusMessage = '' }: { username: string; avatar?: string; statusMessage?: string }): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!socket.connected) socket.connect();

      saveProfileToStorage({ username, avatar, statusMessage });
      socket.emit('create-room', { username, avatar, statusMessage }, (res: { success: boolean; roomCode?: string; error?: string }) => {
        if (res.success && res.roomCode) {
          setState(s => ({
            ...s,
            roomCode: res.roomCode!,
            username,
            isHost: true,
            hostId: socket.id || null,
            error: null,
          }));
          resolve(res.roomCode);
        } else {
          reject(new Error(res.error || 'Failed to create room'));
        }
      });
    });
  }, []);

  const joinRoom = useCallback(({ username, roomCode, avatar = '🍿', statusMessage = '' }: { username: string; roomCode: string; avatar?: string; statusMessage?: string }): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socket.connected) socket.connect();

      saveProfileToStorage({ username, avatar, statusMessage });
      socket.emit('join-room', { username, roomCode, avatar, statusMessage }, (res: {
        success: boolean;
        roomCode?: string;
        videoSource?: VideoSource | null;
        playbackState?: PlaybackState;
        hostId?: string;
        subtitleText?: string | null;
        controlsOpen?: boolean;
        playlist?: VideoSource[];
        error?: string;
      }) => {
        if (res.success && res.roomCode) {
          setState(s => ({
            ...s,
            roomCode: res.roomCode!,
            username,
            isHost: false,
            hostId: res.hostId || null,
            videoSource: res.videoSource || null,
            playbackState: res.playbackState || { playing: false, currentTime: 0 },
            error: null,
            subtitleText: res.subtitleText ?? null,
            controlsOpen: res.controlsOpen ?? false,
            playlist: res.playlist || [],
          }));
          resolve();
        } else {
          socket.disconnect();
          reject(new Error(res.error || 'Failed to join room'));
        }
      });
    });
  }, []);

  const updateUserProfile = useCallback(({ username, avatar, statusMessage }: { username: string; avatar: string; statusMessage: string }) => {
    socket.emit('update-profile', { username, avatar, statusMessage });
    saveProfileToStorage({ username, avatar, statusMessage });
    setState(s => ({
      ...s,
      username,
      users: s.users.map(u => u.socketId === socket.id ? { ...u, username, avatar, statusMessage } : u)
    }));
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
      playlist: [],
      activeReactions: [],
    });
  }, []);

  const sendChat = useCallback((message: string) => {
    socket.emit('chat-message', { message });
  }, []);

  const sendReaction = useCallback((emoji: string) => {
    socket.emit('send-reaction', { emoji });
  }, []);

  const updatePlaylist = useCallback((playlist: VideoSource[]) => {
    socket.emit('playlist-update', { playlist });
    setState(s => ({ ...s, playlist }));
  }, []);

  const playNextInPlaylist = useCallback(() => {
    socket.emit('playlist-next');
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

  const updateVoiceStatus = useCallback((isMuted: boolean, isDeafened: boolean) => {
    socket.emit('voice-status-change', { isMuted, isDeafened });
    setState(s => ({
      ...s,
      users: s.users.map(u => u.socketId === socket.id ? { ...u, isMuted, isDeafened } : u)
    }));
  }, []);

  const emitPlay  = useCallback((currentTime: number) => socket.emit('sync-play',  { currentTime }), []);
  const emitPause = useCallback((currentTime: number) => socket.emit('sync-pause', { currentTime }), []);
  const emitSeek  = useCallback((currentTime: number) => socket.emit('sync-seek',  { currentTime }), []);

  return {
    state,
    createRoom,
    joinRoom,
    updateUserProfile,
    leaveRoom,
    sendChat,
    sendReaction,
    updatePlaylist,
    playNextInPlaylist,
    changeSource,
    changeSubtitles,
    togglePermissions,
    updateVoiceStatus,
    emitPlay,
    emitPause,
    emitSeek,
    rttRef
  };
}
