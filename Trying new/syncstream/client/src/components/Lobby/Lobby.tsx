import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { getSavedProfile } from '../../hooks/useRoom';
import { AVATAR_PRESETS } from '../../constants/avatars';
import { LobbyCardSkeleton } from '../Skeleton/Skeleton';
import './Lobby.css';

interface LobbyProps {
  onCreateRoom: (username: string, avatar?: string, statusMessage?: string) => Promise<void>;
  onJoinRoom: (username: string, roomCode: string, avatar?: string, statusMessage?: string) => Promise<void>;
}

type Tab = 'create' | 'join';

export function Lobby({ onCreateRoom, onJoinRoom }: LobbyProps) {
  const saved = getSavedProfile();
  const [tab, setTab] = useState<Tab>('create');
  const [username, setUsername] = useState(saved.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(saved.avatar || '🍿');
  const [statusMessage, setStatusMessage] = useState(saved.statusMessage || '');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 400);
    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim()) { setError('Please enter a display name.'); return; }
    if (tab === 'join' && !roomCode.trim()) { setError('Please enter a room code.'); return; }

    setError('');
    setLoading(true);
    try {
      if (tab === 'create') {
        await onCreateRoom(username.trim(), selectedAvatar, statusMessage.trim());
      } else {
        await onJoinRoom(username.trim(), roomCode.trim().toUpperCase(), selectedAvatar, statusMessage.trim());
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lobby">
      {/* Background orbs */}
      <div className="lobby-orb lobby-orb-1" />
      <div className="lobby-orb lobby-orb-2" />
      <div className="lobby-orb lobby-orb-3" />

      {showSkeleton ? (
        <LobbyCardSkeleton />
      ) : (
        <div className="lobby-card animate-scale-spring glass">
          {/* Logo */}
          <div className="lobby-logo">
            <div className="lobby-logo-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="url(#gl)" strokeWidth="1.8"/>
                <path d="M11 9.5L19 14L11 18.5V9.5Z" fill="url(#gl)"/>
                <defs>
                  <linearGradient id="gl" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7c3aed"/><stop offset="1" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h1 className="lobby-title">SyncStream</h1>
              <p className="lobby-subtitle">Real-time synchronized video watch parties</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="lobby-tabs" role="tablist">
            <button
              className={`lobby-tab ${tab === 'create' ? 'active' : ''}`}
              onClick={() => { setTab('create'); setError(''); }}
              role="tab"
              aria-selected={tab === 'create'}
              id="tab-create-room"
            >
              Create Room
            </button>
            <button
              className={`lobby-tab ${tab === 'join' ? 'active' : ''}`}
              onClick={() => { setTab('join'); setError(''); }}
              role="tab"
              aria-selected={tab === 'join'}
              id="tab-join-room"
            >
              Join Room
            </button>
          </div>

          {/* Form */}
          <form className="lobby-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username-input" className="label">Display Name</label>
              <input
                id="username-input"
                className="input"
                type="text"
                placeholder="Enter your name…"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                maxLength={20}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="status-input" className="label">Status Message (optional)</label>
              <input
                id="status-input"
                className="input"
                type="text"
                placeholder='e.g. "Watching Sci-Fi", "Ready!"'
                value={statusMessage}
                onChange={e => setStatusMessage(e.target.value)}
                maxLength={30}
              />
            </div>

            {/* Avatar Selection */}
            <div className="form-group">
              <label className="label">Choose Avatar ({selectedAvatar})</label>
              <div className="lobby-avatar-picker">
                {AVATAR_PRESETS.slice(0, 14).map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`lobby-avatar-item ${selectedAvatar === preset.icon ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(preset.icon)}
                    title={preset.label}
                  >
                    {preset.icon}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'join' && (
              <div className="form-group animate-fade-in">
                <label htmlFor="roomcode-input" className="label">Room Code</label>
                <input
                  id="roomcode-input"
                  className="input input-mono"
                  type="text"
                  placeholder="e.g. A1B2C3"
                  value={roomCode}
                  onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
                  maxLength={8}
                  required
                />
              </div>
            )}

            {error && (
              <div className="lobby-error animate-fade-in" role="alert">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 3.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary lobby-submit-btn"
              disabled={loading}
              id="lobby-submit-btn"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" />
                  {tab === 'create' ? 'Creating room…' : 'Joining room…'}
                </span>
              ) : (
                tab === 'create' ? '✦ Create Room' : '✦ Join Room'
              )}
            </button>
          </form>

          {/* Quick instructions footer */}
          <div className="lobby-info-footer">
            <p>🔒 End-to-end P2P streaming • ⚡ Real-time sync • 👥 Up to 6 people</p>
          </div>
        </div>
      )}
    </div>
  );
}
