import type { RoomUser } from '../../hooks/useRoom';
import { socket } from '../../socket';
import './UserList.css';

interface UserListProps {
  users: RoomUser[];
  hostId: string | null;
  roomCode: string;
  onLeave: () => void;
}

export function UserList({ users, hostId, roomCode, onLeave }: UserListProps) {
  const myId = socket.id;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch { /* fallback — just ignore */ }
  }

  return (
    <div className="userlist">
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

      {/* User list */}
      <div className="userlist-title">
        <span>Watching</span>
        <span className="userlist-count">{users.length} / 6</span>
      </div>

      <ul className="userlist-users" role="list">
        {users.map(user => {
          const isMe = user.socketId === myId;
          const isHost = user.socketId === hostId;
          return (
            <li key={user.socketId} className={`userlist-user ${isMe ? 'is-me' : ''}`}>
              <div className="userlist-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="userlist-username">
                {user.username}
                {isMe && <span className="userlist-you"> (you)</span>}
              </span>
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
