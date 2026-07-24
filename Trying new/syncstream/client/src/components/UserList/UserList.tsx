import { useState, useEffect } from 'react';
import type { RoomUser } from '../../hooks/useRoom';
import { socket } from '../../socket';
import { UserListSkeleton } from '../Skeleton/Skeleton';
import './UserList.css';

interface UserListProps {
  users: RoomUser[];
  hostId: string | null;
  roomCode: string;
  onLeave: () => void;
  voiceActive?: boolean;
  isMuted?: boolean;
  isDeafened?: boolean;
  onJoinVoice?: () => void;
  onLeaveVoice?: () => void;
  onToggleMic?: () => void;
  onToggleDeafen?: () => void;
}

function getPingQuality(ping?: number) {
  if (!ping || ping <= 0) return { color: '#10b981', label: 'Good', text: '< 30ms' };
  if (ping < 70) return { color: '#10b981', label: 'Excellent', text: `${ping}ms` };
  if (ping < 180) return { color: '#f59e0b', label: 'Fair', text: `${ping}ms` };
  return { color: '#ef4444', label: 'Poor (Lagging)', text: `${ping}ms` };
}

export function UserList({
  users,
  hostId,
  roomCode,
  onLeave,
  voiceActive,
  isMuted,
  isDeafened,
  onJoinVoice,
  onLeaveVoice,
  onToggleMic,
  onToggleDeafen,
}: UserListProps) {
  const myId = socket.id;
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 500);
    return () => clearTimeout(timer);
  }, []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch { /* fallback */ }
  }

  if (showSkeleton) {
    return <UserListSkeleton />;
  }

  return (
    <div className="userlist animate-fade-in">
      {/* Room code header */}
      <div className="userlist-header">
        <div className="userlist-room-info">
          <span className="userlist-label">Room Code</span>
          <div className="userlist-code-row">
            <span className="userlist-code">{roomCode}</span>
            <button
              className="btn-icon userlist-copy-btn"
              onClick={copyCode}
              title="Copy room code"
              id="copy-room-code-btn"
              aria-label="Copy room code"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M2 10V2h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <button
          className="btn btn-ghost userlist-leave-btn"
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

      {/* Voice Chat Control Box */}
      <div className="voice-control-box">
        {!voiceActive ? (
          <button className="btn btn-primary voice-join-btn" onClick={onJoinVoice}>
            🎙️ Join Voice Chat
          </button>
        ) : (
          <div className="voice-controls-active">
            <button
              className={`btn-icon voice-action-btn ${isMuted ? 'muted' : 'active'}`}
              onClick={onToggleMic}
              title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMuted ? '🔇' : '🎙️'}
            </button>
            <button
              className={`btn-icon voice-action-btn ${isDeafened ? 'deafened' : 'active'}`}
              onClick={onToggleDeafen}
              title={isDeafened ? 'Undeafen' : 'Deafen'}
            >
              {isDeafened ? '🚫' : '🎧'}
            </button>
            <button
              className="btn btn-ghost btn-sm voice-disconnect-btn"
              onClick={onLeaveVoice}
              title="Leave Voice Chat"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* User list */}
      <div className="userlist-title">
        <span>Watching</span>
        <span className="userlist-count">{users.length} / 6</span>
      </div>

      <ul className="userlist-users" role="list">
        {users.map((user, index) => {
          const isMe = user.socketId === myId;
          const isHost = user.socketId === hostId;
          const pingQuality = getPingQuality(user.ping);

          return (
            <li
              key={user.socketId}
              className={`userlist-user ${isMe ? 'is-me' : ''}`}
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div className="userlist-avatar">
                {user.avatar || user.username.charAt(0).toUpperCase()}
              </div>

              <div className="userlist-details">
                <span className="userlist-username">
                  {user.username}
                  {isMe && <span className="userlist-you"> (you)</span>}
                </span>
                {user.statusMessage && (
                  <span className="userlist-status-msg">{user.statusMessage}</span>
                )}
              </div>

              {/* Real-time Ping Meter */}
              <span
                className="user-ping-badge"
                style={{ color: pingQuality.color }}
                title={`Network Latency: ${user.ping || 0}ms (${pingQuality.label})`}
              >
                <span className="ping-dot" style={{ backgroundColor: pingQuality.color }} />
                {pingQuality.text}
              </span>

              {user.isMuted && <span className="voice-status-tag" title="Muted">🔇</span>}
              {user.isDeafened && <span className="voice-status-tag" title="Deafened">🎧🚫</span>}

              {isHost && (
                <span className="userlist-host-badge" title="Host">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1L7.5 4.5H11L8.5 6.5L9.5 10L6 8L2.5 10L3.5 6.5L1 4.5H4.5L6 1Z" fill="currentColor"/>
                  </svg>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
