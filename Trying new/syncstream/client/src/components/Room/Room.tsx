import { useState } from 'react';
import type { RoomState, VideoSource } from '../../hooks/useRoom';
import { useWebRTC } from '../../hooks/useWebRTC';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { UserList } from '../UserList/UserList';
import { Chat } from '../Chat/Chat';
import { SourcePicker } from '../SourcePicker/SourcePicker';
import { socket } from '../../socket';
import './Room.css';

interface RoomProps {
  state: RoomState;
  onLeave: () => void;
  onSendChat: (msg: string) => void;
  onChangeSource: (source: VideoSource) => void;
  onEmitPlay: (t: number) => void;
  onEmitPause: (t: number) => void;
  onEmitSeek: (t: number) => void;
}

export function Room({
  state,
  onLeave,
  onSendChat,
  onChangeSource,
  onEmitPlay,
  onEmitPause,
  onEmitSeek,
}: RoomProps) {
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  // FIX: Use useState instead of useRef so useWebRTC re-renders with the new stream
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const { requestStream, remoteStream } = useWebRTC({
    isHost: state.isHost,
    hostId: state.hostId,
    localStream,
  });

  function handleLocalStream(stream: MediaStream) {
    console.log('[Room] Captured local stream. Tracks:', stream.getTracks().map(t => `${t.kind}(${t.label})`));
    setLocalStream(stream);
  }

  function handleSourceConfirm(source: VideoSource) {
    onChangeSource(source);
    setShowSourcePicker(false);
  }

  return (
    <div className="room animate-fade-in">
      {/* Top header bar */}
      <header className="room-header">
        <div className="room-header-logo">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="url(#gh)" strokeWidth="1.5"/>
            <path d="M7.5 6.5L14 10L7.5 13.5V6.5Z" fill="url(#gh)"/>
            <defs>
              <linearGradient id="gh" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7c3aed"/><stop offset="1" stopColor="#a855f7"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="room-header-name">SyncStream</span>
        </div>

        <div className="room-header-center">
          {state.isHost && (
            <span className="badge badge-accent">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1L6.5 3.5H9L7 5.5L7.5 8.5L5 7L2.5 8.5L3 5.5L1 3.5H3.5L5 1Z" fill="currentColor"/>
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
        </div>
      </header>

      {/* Main layout */}
      <div className="room-body">
        {/* Left: video */}
        <main className="room-main">
          <VideoPlayer
            isHost={state.isHost}
            videoSource={state.videoSource}
            onPlay={onEmitPlay}
            onPause={onEmitPause}
            onSeek={onEmitSeek}
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
          />
          <Chat
            messages={state.chatMessages}
            onSend={onSendChat}
            mySocketId={socket.id}
          />
        </aside>
      </div>

      {/* Source picker modal */}
      {showSourcePicker && (
        <SourcePicker
          onConfirm={handleSourceConfirm}
          onClose={() => setShowSourcePicker(false)}
        />
      )}
    </div>
  );
}
