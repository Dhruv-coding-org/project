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
  if (!ping || ping <= 0) return { color: '#34d399', label: 'Good', text: '< 20ms' };
  if (ping < 70) return { color: '#34d399', label: 'Excellent', text: `${ping}ms` };
  if (ping < 180) return { color: '#fbbf24', label: 'Fair', text: `${ping}ms` };
  return { color: '#f87171', label: 'High Latency', text: `${ping}ms` };
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
          <span className="voice-title">🎙️ P2P Voice Channel</span>
          <span className={`voice-status-badge ${voiceActive ? 'active' : ''}`}>
            {voiceActive ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        {!voiceActive ? (
          <button className="btn btn-primary voice-join-btn" onClick={onJoinVoice}>
            ⚡ Connect Voice Chat
          </button>
        ) : (
          <div className="voice-controls-active">
            <button
              className={`btn-icon voice-action-btn ${isMuted ? 'muted' : 'active'}`}
              onClick={onToggleMic}
              title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMuted ? '🔇 Muted' : '🎙️ Mic On'}
            </button>
            <button
              className={`btn-icon voice-action-btn ${isDeafened ? 'deafened' : 'active'}`}
              onClick={onToggleDeafen}
              title={isDeafened ? 'Undeafen' : 'Deafen Audio'}
            >
              {isDeafened ? '🚫 Deafened' : '🎧 Audio On'}
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
          📋 {roomCode}
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
                      👑 Host
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
                {user.isMuted && <span className="voice-status-tag" title="Muted">🔇</span>}
                {user.isDeafened && <span className="voice-status-tag" title="Deafened">🎧🚫</span>}

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
          🚪 Leave Watch Party
        </button>
      </div>
    </div>
  );
}
