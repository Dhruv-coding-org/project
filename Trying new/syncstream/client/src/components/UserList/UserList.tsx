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
  if (!ping || ping <= 0) return { color: '#10B981', label: 'Good', text: '< 20ms' };
  if (ping < 70) return { color: '#10B981', label: 'Excellent', text: `${ping}ms` };
  if (ping < 180) return { color: '#F59E0B', label: 'Fair', text: `${ping}ms` };
  return { color: '#EF4444', label: 'High Latency', text: `${ping}ms` };
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
    const timer = setTimeout(() => setShowSkeleton(false), 300);
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
      {/* Voice Chat Control Box */}
      <div className="voice-control-box">
        <div className="voice-control-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1a2.5 2.5 0 00-2.5 2.5v5a2.5 2.5 0 005 0v-5A2.5 2.5 0 008 1z"/>
              <path d="M13 7v1.5a5 5 0 01-10 0V7M8 13.5v2M5.5 15.5h5"/>
            </svg>
            <span className="voice-title">P2P Voice Channel</span>
          </div>
          <span className={`voice-status-badge ${voiceActive ? 'active' : ''}`}>
            {voiceActive ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        {!voiceActive ? (
          <button className="btn btn-primary voice-join-btn" onClick={onJoinVoice}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="8 1 2 9 8 9 8 15 14 7 8 7 8 1"/>
            </svg>
            Connect Voice Channel
          </button>
        ) : (
          <div className="voice-controls-active">
            <button
              className={`btn-icon voice-action-btn ${isMuted ? 'muted' : 'active'}`}
              onClick={onToggleMic}
              title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 1a2.5 2.5 0 00-2.5 2.5v5a2.5 2.5 0 005 0v-5A2.5 2.5 0 008 1z"/>
                <path d="M13 7v1.5a5 5 0 01-10 0V7M8 13.5v2M5.5 15.5h5"/>
                {isMuted && <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8"/>}
              </svg>
              <span>{isMuted ? 'Muted' : 'Mic On'}</span>
            </button>
            <button
              className={`btn-icon voice-action-btn ${isDeafened ? 'deafened' : 'active'}`}
              onClick={onToggleDeafen}
              title={isDeafened ? 'Undeafen' : 'Deafen Audio'}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 9a6 6 0 0112 0v4a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 011-1h3"/>
                <path d="M2 13a1 1 0 001 1h2a1 1 0 001-1v-3a1 1 0 00-1-1H2v4z"/>
                {isDeafened && <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8"/>}
              </svg>
              <span>{isDeafened ? 'Deafened' : 'Audio On'}</span>
            </button>
            <button
              className="btn btn-ghost btn-sm voice-disconnect-btn"
              onClick={onLeaveVoice}
              title="Leave Voice Channel"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* User list title bar */}
      <div className="userlist-title-bar">
        <div className="userlist-title-left">
          <span>Active Watchers</span>
          <span className="userlist-count-badge">{users.length} / 6</span>
        </div>
        <button
          className="btn-icon userlist-copy-code-btn"
          onClick={copyCode}
          title="Copy Room Code"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="4" y="4" width="8" height="8" rx="1.5"/>
            <path d="M2 10V2h8"/>
          </svg>
          <span>{roomCode}</span>
        </button>
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
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`userlist-avatar ${voiceActive && !user.isMuted ? 'speaking-aura' : ''}`}>
                {user.avatar || user.username.charAt(0).toUpperCase()}
              </div>

              <div className="userlist-details">
                <div className="userlist-name-row">
                  <span className="userlist-username">
                    {user.username}
                  </span>
                  {isMe && <span className="userlist-you"> (You)</span>}
                  {isHost && (
                    <span className="userlist-host-badge" title="Room Host">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1l2.5 5h5.5l-4.5 3.5 1.5 5.5-5-3.5-5 3.5 1.5-5.5L0 6h5.5z"/>
                      </svg>
                      Host
                    </span>
                  )}
                </div>
                {user.statusMessage ? (
                  <span className="userlist-status-msg">{user.statusMessage}</span>
                ) : (
                  <span className="userlist-status-msg default">Ready to stream</span>
                )}
              </div>

              <div className="userlist-right-meta">
                {user.isMuted && (
                  <span className="voice-status-tag" title="Muted">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M8 1a2.5 2.5 0 00-2.5 2.5v5a2.5 2.5 0 005 0v-5A2.5 2.5 0 008 1z"/>
                      <path d="M13 7v1.5a5 5 0 01-10 0V7M8 13.5v2M5.5 15.5h5"/>
                      <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.6"/>
                    </svg>
                  </span>
                )}
                {user.isDeafened && (
                  <span className="voice-status-tag" title="Deafened">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M2 9a6 6 0 0112 0v4a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 011-1h3"/>
                      <path d="M2 13a1 1 0 001 1h2a1 1 0 001-1v-3a1 1 0 00-1-1H2v4z"/>
                      <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.6"/>
                    </svg>
                  </span>
                )}

                {/* Real-time Ping Meter */}
                <span
                  className="user-ping-badge"
                  style={{ color: pingQuality.color }}
                  title={`Network Latency: ${user.ping || 0}ms (${pingQuality.label})`}
                >
                  <span className="ping-dot" style={{ backgroundColor: pingQuality.color }} />
                  {pingQuality.text}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* UserList Footer */}
      <div className="userlist-footer">
        <button className="btn btn-ghost userlist-footer-leave-btn" onClick={onLeave} title="Leave Room">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M9 13H3a1 1 0 01-1-1V4a1 1 0 011-1h6M11 11l3-3-3-3M6 8h8"/>
          </svg>
          Leave Watch Party
        </button>
      </div>
    </div>
  );
}
