import { useState, useEffect, useMemo } from 'react';
import type { RoomState, VideoSource } from '../../hooks/useRoom';
import { useWebRTC } from '../../hooks/useWebRTC';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { UserList } from '../UserList/UserList';
import { Chat } from '../Chat/Chat';
import { SourcePicker } from '../SourcePicker/SourcePicker';
import { PlaylistModal } from '../Playlist/PlaylistModal';
import { ProfileModal } from '../Profile/ProfileModal';
import { RoomSkeleton } from '../Skeleton/Skeleton';
import { parseSubtitles } from '../../utils/subtitleParser';
import type { SubtitleCue } from '../../utils/subtitleParser';
import type { UserProfile } from '../../types';
import { socket } from '../../socket';
import './Room.css';

interface RoomProps {
  state: RoomState;
  onLeave: () => void;
  onSendChat: (msg: string) => void;
  onSendReaction?: (emoji: string) => void;
  onUpdatePlaylist?: (playlist: VideoSource[]) => void;
  onPlayNextInPlaylist?: () => void;
  onUpdateVoiceStatus?: (isMuted: boolean, isDeafened: boolean) => void;
  onUpdateUserProfile?: (profile: UserProfile) => void;
  onChangeSource: (source: VideoSource) => void;
  onChangeSubtitles: (text: string | null) => void;
  onTogglePermissions: (open: boolean) => void;
  onEmitPlay: (t: number) => void;
  onEmitPause: (t: number) => void;
  onEmitSeek: (t: number) => void;
}

export function Room({
  state,
  onLeave,
  onSendChat,
  onSendReaction,
  onUpdatePlaylist,
  onPlayNextInPlaylist,
  onUpdateVoiceStatus,
  onUpdateUserProfile,
  onChangeSource,
  onChangeSubtitles,
  onTogglePermissions,
  onEmitPlay,
  onEmitPause,
  onEmitSeek,
}: RoomProps) {
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const {
    requestStream,
    remoteStream,
    voiceActive,
    isMuted,
    isDeafened,
    joinVoice,
    leaveVoice,
    toggleMic,
    toggleDeafen
  } = useWebRTC({
    isHost: state.isHost,
    hostId: state.hostId,
    localStream,
    onVoiceStatusChange: onUpdateVoiceStatus
  });

  const canControl = state.isHost || state.controlsOpen;

  // Parse subtitle text into cues
  const subtitleCues: SubtitleCue[] = useMemo(() => {
    if (!state.subtitleText) return [];
    return parseSubtitles(state.subtitleText);
  }, [state.subtitleText]);

  // Show skeleton briefly on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Host responds to guest's sync request with current playback position
  useEffect(() => {
    if (!state.isHost) return;

    function handleSyncRequest(e: Event) {
      const detail = (e as CustomEvent).detail;
      const videoEl = document.querySelector('.vp-video') as HTMLVideoElement | null;
      let currentTime = 0;
      let playing = false;

      if (videoEl && videoEl.tagName === 'VIDEO') {
        currentTime = videoEl.currentTime || 0;
        playing = !videoEl.paused;
      }

      socket.emit('sync-response', {
        guestId: detail.guestId,
        currentTime,
        playing,
      });
    }

    window.addEventListener('sync-request-from-guest', handleSyncRequest);
    return () => window.removeEventListener('sync-request-from-guest', handleSyncRequest);
  }, [state.isHost]);

  function handleLocalStream(stream: MediaStream) {
    setLocalStream(stream);
  }

  function handleSourceConfirm(source: VideoSource) {
    onChangeSource(source);
    setShowSourcePicker(false);
  }

  function handleSubtitlesLoaded(text: string | null) {
    onChangeSubtitles(text);
  }

  function handleCopyCode() {
    if (!state.roomCode) return;
    navigator.clipboard.writeText(state.roomCode).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    });
  }

  function handleLogoClick() {
    if (state.isHost) {
      const videoEl = document.querySelector('.vp-video') as HTMLVideoElement | null;
      if (videoEl) {
        if (!videoEl.paused) onEmitPlay(videoEl.currentTime);
        else onEmitPause(videoEl.currentTime);
      }
    }
  }

  if (showSkeleton) {
    return <RoomSkeleton />;
  }

  return (
    <div className="room animate-fade-in">
      {/* Toast notification */}
      {copiedToast && (
        <div className="toast-container">
          <div className="toast toast-success animate-slide-up">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Room code copied!
          </div>
        </div>
      )}

      {/* Top header bar */}
      <header className="room-header">
        <div
          className={`room-header-logo ${state.isHost ? 'clickable' : ''}`}
          onClick={handleLogoClick}
          title={state.isHost ? 'Click to refresh room sync' : 'SyncStream'}
        >
          <div className="room-logo-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="url(#gh)" strokeWidth="1.5"/>
              <path d="M7.5 6.5L14 10L7.5 13.5V6.5Z" fill="url(#gh)"/>
              <defs>
                <linearGradient id="gh" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c3aed"/><stop offset="1" stopColor="#c084fc"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="room-header-name">SyncStream</span>
        </div>

        <div className="room-header-center">
          {/* Room code inline */}
          <button
            className="room-code-chip"
            onClick={handleCopyCode}
            title="Click to copy room code"
            id="room-code-chip"
          >
            <span className="room-code-label">ROOM</span>
            <span className="room-code-value">{state.roomCode}</span>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 10V2h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="room-header-divider" />

          {state.isHost && (
            <span className="badge badge-accent">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path d="M5 1L6.5 3.5H9L7 5.5L7.5 8.5L5 7L2.5 8.5L3 5.5L1 3.5H5 1Z" fill="currentColor"/>
              </svg>
              Host
            </span>
          )}

          <span className="room-header-status">
            <span className={`room-status-dot ${state.connected ? 'connected' : 'disconnected'}`} />
            {state.connected ? 'Connected' : 'Reconnecting…'}
          </span>
        </div>

        <div className="room-header-right">
          {/* Profile Settings Button */}
          <button
            className="btn btn-ghost room-profile-btn"
            onClick={() => setShowProfileModal(true)}
            title="Profile Settings"
          >
            👤 Profile
          </button>

          {/* Playlist Queue Button */}
          <button
            className="btn btn-ghost room-playlist-btn"
            onClick={() => setShowPlaylistModal(true)}
            title="View Queue / Playlist"
          >
            📜 Queue ({state.playlist?.length || 0})
          </button>

          {/* Permissions toggle (host-only) */}
          {state.isHost && (
            <button
              className={`btn btn-ghost room-permissions-btn ${state.controlsOpen ? 'active' : ''}`}
              onClick={() => onTogglePermissions(!state.controlsOpen)}
              title={state.controlsOpen ? 'Everyone can control — click to lock' : 'Only host controls — click to unlock'}
              id="room-permissions-btn"
            >
              {state.controlsOpen ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="7" width="10" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4 7V4.5a3 3 0 016 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="7" width="10" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4 7V4.5a3 3 0 016 0V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          )}

          {state.isHost && (
            <button
              className="btn btn-ghost room-source-btn"
              onClick={() => setShowSourcePicker(true)}
              id="open-source-picker-btn"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5.5 5l3 2-3 2V5z" fill="currentColor"/>
              </svg>
              Load Video
            </button>
          )}

          <button
            className="btn btn-ghost room-leave-btn"
            onClick={onLeave}
            id="leave-room-btn"
            title="Leave room"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 7H2M2 7L4.5 4.5M2 7L4.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 2h5a1 1 0 011 1v8a1 1 0 01-1 1H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Leave
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="room-body">
        {/* Left: video */}
        <main className="room-main">
          <VideoPlayer
            isHost={state.isHost}
            canControl={canControl}
            videoSource={state.videoSource}
            subtitleCues={subtitleCues}
            activeReactions={state.activeReactions}
            onPlay={onEmitPlay}
            onPause={onEmitPause}
            onSeek={onEmitSeek}
            onEnded={onPlayNextInPlaylist}
            onLocalStream={handleLocalStream}
            remoteStreamRef={remoteStream}
            onRequestStream={requestStream}
          />
        </main>

        {/* Right sidebar */}
        <aside className="room-sidebar glass">
          <UserList
            users={state.users}
            hostId={state.hostId}
            roomCode={state.roomCode!}
            onLeave={onLeave}
            voiceActive={voiceActive}
            isMuted={isMuted}
            isDeafened={isDeafened}
            onJoinVoice={joinVoice}
            onLeaveVoice={leaveVoice}
            onToggleMic={toggleMic}
            onToggleDeafen={toggleDeafen}
          />
          <Chat
            messages={state.chatMessages}
            onSend={onSendChat}
            onSendReaction={onSendReaction}
            onSeek={onEmitSeek}
            mySocketId={socket.id}
          />
        </aside>
      </div>

      {/* Source picker modal */}
      {showSourcePicker && (
        <SourcePicker
          onConfirm={handleSourceConfirm}
          onSubtitlesLoaded={handleSubtitlesLoaded}
          onClose={() => setShowSourcePicker(false)}
        />
      )}

      {/* Playlist modal */}
      {showPlaylistModal && (
        <PlaylistModal
          playlist={state.playlist || []}
          canControl={canControl}
          onUpdatePlaylist={onUpdatePlaylist || (() => {})}
          onPlayNext={onPlayNextInPlaylist || (() => {})}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}

      {/* Profile modal */}
      {showProfileModal && (
        <ProfileModal
          currentProfile={{
            username: state.username,
            avatar: state.users.find(u => u.socketId === socket.id)?.avatar || '🍿',
            statusMessage: state.users.find(u => u.socketId === socket.id)?.statusMessage || ''
          }}
          onSave={onUpdateUserProfile || (() => {})}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
