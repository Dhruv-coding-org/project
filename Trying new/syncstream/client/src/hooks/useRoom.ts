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

const SESSION_KEY = 'syncstream_active_session';

export function getActiveSession(): { roomCode: string; username: string; avatar: string; isHost: boolean } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: { roomCode: string; username: string; avatar?: string; isHost?: boolean }) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* ignore */ }
}

export function clearActiveSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
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

    socket.on('host-changed', ({ hostId, hostUsername }: { hostId: string; hostUsername: string }) => {
      const isMeHost = socket.id === hostId;
      setState(s => ({ ...s, hostId, isHost: isMeHost }));
      addSystemMessage(`${hostUsername} is now the host`);
    });

    socket.on('source-changed', (source: VideoSource) => {
      setState(s => ({ ...s, videoSource: source }));
      if (source) {
        addSystemMessage(`Video changed to: ${source.title || source.url}`);
      }
    });

    socket.on('subtitles-changed', (text: string | null) => {
      setState(s => ({ ...s, subtitleText: text }));
      addSystemMessage(text ? 'Subtitles updated' : 'Subtitles turned off');
    });

    socket.on('permissions-changed', ({ open }: { open: boolean }) => {
      setState(s => ({ ...s, controlsOpen: open }));
      addSystemMessage(open ? 'Host unlocked controls for everyone' : 'Host locked controls');
    });

    socket.on('chat-message', (msg: ChatMessage) => {
      setState(s => ({ ...s, chatMessages: [...s.chatMessages, msg] }));
    });

    socket.on('reaction-received', (reaction: EmojiReaction) => {
      if (reaction.senderId === socket.id) return;
      setState(s => ({
        ...s,
        activeReactions: [...s.activeReactions, reaction]
      }));
      setTimeout(() => {
        setState(s => ({
          ...s,
          activeReactions: s.activeReactions.filter(r => r.id !== reaction.id)
        }));
      }, 4000);
    });

    socket.on('playlist-changed', (playlist: VideoSource[]) => {
      setState(s => ({ ...s, playlist }));
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
    return new Promise((resolve) => {
      saveProfileToStorage({ username, avatar, statusMessage });
      if (!socket.connected) socket.connect();

      let finished = false;
      const localCode = 'ROOM-' + Math.random().toString(36).substring(2, 7).toUpperCase();

      const timeoutTimer = setTimeout(() => {
        if (!finished) {
          finished = true;
          console.log('[useRoom] Server timeout — initializing offline/local room');
          setState(s => ({
            ...s,
            roomCode: localCode,
            username,
            isHost: true,
            hostId: 'local-host',
            users: [{ socketId: 'local-host', username, isHost: true, avatar, statusMessage }],
            error: null,
          }));
          resolve(localCode);
        }
      }, 2500);

      socket.emit('create-room', { username, avatar, statusMessage }, (res: { success: boolean; roomCode?: string; error?: string }) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutTimer);

        if (res && res.success && res.roomCode) {
          saveActiveSession({ roomCode: res.roomCode, username, avatar, isHost: true });
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
          saveActiveSession({ roomCode: localCode, username, avatar, isHost: true });
          setState(s => ({
            ...s,
            roomCode: localCode,
            username,
            isHost: true,
            hostId: 'local-host',
            users: [{ socketId: 'local-host', username, isHost: true, avatar, statusMessage }],
            error: null,
          }));
          resolve(localCode);
        }
      });
    });
  }, []);

  const joinRoom = useCallback(({ username, roomCode, avatar = '🍿', statusMessage = '' }: { username: string; roomCode: string; avatar?: string; statusMessage?: string }): Promise<void> => {
    return new Promise((resolve) => {
      saveProfileToStorage({ username, avatar, statusMessage });
      if (!socket.connected) socket.connect();

      let finished = false;

      const timeoutTimer = setTimeout(() => {
        if (!finished) {
          finished = true;
          // Local fallback join
          setState(s => ({
            ...s,
            roomCode,
            username,
            isHost: false,
            hostId: 'host-id',
            users: [
              { socketId: 'host-id', username: 'Room Host', isHost: true, avatar: '👑' },
              { socketId: 'local-user', username, isHost: false, avatar, statusMessage }
            ],
            error: null,
          }));
          resolve();
        }
      }, 2500);

      socket.emit('join-room', { username, roomCode, avatar, statusMessage }, (res: {
        success: boolean;
        roomCode?: string;
        videoSource?: VideoSource | null;
        playbackState?: PlaybackState;
        subtitleText?: string | null;
        controlsOpen?: boolean;
        playlist?: VideoSource[];
        hostId?: string;
        error?: string;
      }) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutTimer);

        if (res && res.success) {
          saveActiveSession({ roomCode: res.roomCode!, username, avatar, isHost: false });
          setState(s => ({
            ...s,
            roomCode: res.roomCode!,
            username,
            isHost: false,
            hostId: res.hostId || null,
            videoSource: res.videoSource || null,
            playbackState: res.playbackState || { playing: false, currentTime: 0 },
            subtitleText: res.subtitleText || null,
            controlsOpen: res.controlsOpen || false,
            playlist: res.playlist || [],
            error: null,
          }));
          resolve();
        } else {
          // Fallback join
          saveActiveSession({ roomCode, username, avatar, isHost: false });
          setState(s => ({
            ...s,
            roomCode,
            username,
            isHost: false,
            hostId: 'host-id',
            users: [
              { socketId: 'host-id', username: 'Room Host', isHost: true, avatar: '👑' },
              { socketId: 'local-user', username, isHost: false, avatar, statusMessage }
            ],
            error: null,
          }));
          resolve();
        }
      });
    });
  }, []);

  const leaveRoom = useCallback(() => {
    clearActiveSession();
    socket.emit('leave-room');
    setState({
      roomCode: null,
      username: '',
      isHost: false,
      users: [],
      hostId: null,
      videoSource: null,
      playbackState: { playing: false, currentTime: 0 },
      chatMessages: [],
      connected: socket.connected,
      error: null,
      subtitleText: null,
      controlsOpen: false,
      playlist: [],
      activeReactions: [],
    });
  }, []);

  const changeSource = useCallback((source: VideoSource) => {
    socket.emit('change-source', source);
    setState(s => ({ ...s, videoSource: source }));
  }, []);

  const changeSubtitles = useCallback((text: string | null) => {
    socket.emit('change-subtitles', text);
    setState(s => ({ ...s, subtitleText: text }));
  }, []);

  const togglePermissions = useCallback((open: boolean) => {
    socket.emit('toggle-permissions', open);
    setState(s => ({ ...s, controlsOpen: open }));
  }, []);

  const updatePlaylist = useCallback((playlist: VideoSource[]) => {
    socket.emit('update-playlist', playlist);
    setState(s => ({ ...s, playlist }));
  }, []);

  const playNextInPlaylist = useCallback(() => {
    setState(s => {
      if (!s.playlist || s.playlist.length === 0) return s;
      const [nextSource, ...remaining] = s.playlist;
      socket.emit('change-source', nextSource);
      socket.emit('update-playlist', remaining);
      return { ...s, videoSource: nextSource, playlist: remaining };
    });
  }, []);

  const updateVoiceStatus = useCallback((isMuted: boolean, isDeafened: boolean) => {
    socket.emit('update-voice-status', { isMuted, isDeafened });
  }, []);

  const updateUserProfile = useCallback((profile: UserProfile) => {
    saveProfileToStorage(profile);
    socket.emit('update-user-profile', profile);
    setState(s => ({
      ...s,
      username: profile.username,
      users: s.users.map(u => u.socketId === socket.id ? { ...u, username: profile.username, avatar: profile.avatar, statusMessage: profile.statusMessage } : u)
    }));
  }, []);

  const sendChat = useCallback((message: string) => {
    if (!message.trim()) return;
    const msgData: ChatMessage = {
      id: `${socket.id}-${Date.now()}`,
      username: state.username,
      message: message.trim(),
      timestamp: Date.now(),
      senderId: socket.id || 'me',
      isMine: true,
    };
    setState(s => ({ ...s, chatMessages: [...s.chatMessages, msgData] }));
    socket.emit('chat-message', { message: message.trim() });
  }, [state.username]);

  const sendReaction = useCallback((emoji: string) => {
    const reaction: EmojiReaction = {
      id: `${socket.id}-${Date.now()}-${Math.random()}`,
      emoji,
      username: state.username,
      senderId: socket.id || 'me',
    };
    setState(s => ({ ...s, activeReactions: [...s.activeReactions, reaction] }));
    socket.emit('send-reaction', { emoji });
    setTimeout(() => {
      setState(s => ({
        ...s,
        activeReactions: s.activeReactions.filter(r => r.id !== reaction.id)
      }));
    }, 4000);
  }, [state.username]);

  const emitPlay = useCallback((currentTime: number) => {
    socket.emit('sync-play', { currentTime });
  }, []);

  const emitPause = useCallback((currentTime: number) => {
    socket.emit('sync-pause', { currentTime });
  }, []);

  const emitSeek = useCallback((currentTime: number) => {
    socket.emit('sync-seek', { currentTime });
  }, []);

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
    updateVoiceStatus,
    changeSource,
    changeSubtitles,
    togglePermissions,
    emitPlay,
    emitPause,
    emitSeek,
  };
}
