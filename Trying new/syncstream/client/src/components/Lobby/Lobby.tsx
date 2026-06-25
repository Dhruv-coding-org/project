import { useState } from 'react';
import type { FormEvent } from 'react';
import './Lobby.css';

interface LobbyProps {
  onCreateRoom: (username: string) => Promise<void>;
  onJoinRoom: (username: string, roomCode: string) => Promise<void>;
}

type Tab = 'create' | 'join';

export function Lobby({ onCreateRoom, onJoinRoom }: LobbyProps) {
  const [tab, setTab] = useState<Tab>('create');
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim()) { setError('Please enter a display name.'); return; }
    if (tab === 'join' && !roomCode.trim()) { setError('Please enter a room code.'); return; }

    setError('');
    setLoading(true);
    try {
      if (tab === 'create') {
        await onCreateRoom(username.trim());
      } else {
        await onJoinRoom(username.trim(), roomCode.trim().toUpperCase());
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

      <div className="lobby-card animate-slide-up glass">
        {/* Logo */}
        <div className="lobby-logo">
          <div className="lobby-logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="url(#g1)" strokeWidth="2"/>
              <path d="M10 9.5L20 14L10 18.5V9.5Z" fill="url(#g1)"/>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c3aed"/>
                  <stop offset="1" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="lobby-logo-name">SyncStream</h1>
            <p className="lobby-logo-tagline">Watch together, in perfect sync</p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="lobby-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'create'}
            className={`lobby-tab ${tab === 'create' ? 'active' : ''}`}
            onClick={() => { setTab('create'); setError(''); }}
            id="tab-create"
          >
            Create Room
          </button>
          <button
            role="tab"
            aria-selected={tab === 'join'}
            className={`lobby-tab ${tab === 'join' ? 'active' : ''}`}
            onClick={() => { setTab('join'); setError(''); }}
            id="tab-join"
          >
            Join Room
          </button>
        </div>

        {/* Form */}
        <form className="lobby-form" onSubmit={handleSubmit} noValidate>
          <div className="lobby-field">
            <label htmlFor="lobby-username" className="lobby-label">Your display name</label>
            <input
              id="lobby-username"
              className="input"
              type="text"
              placeholder="e.g. Alex"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={24}
              autoComplete="off"
              autoFocus
            />
          </div>

          {tab === 'join' && (
            <div className="lobby-field animate-slide-up">
              <label htmlFor="lobby-roomcode" className="lobby-label">Room code</label>
              <input
                id="lobby-roomcode"
                className="input lobby-code-input"
                type="text"
                placeholder="e.g. ABCDE1"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoComplete="off"
              />
            </div>
          )}

          {error && (
            <div className="lobby-error animate-fade-in" role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5"/>
                <path d="M8 5v3M8 11v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary lobby-submit"
            disabled={loading}
            id="lobby-submit-btn"
          >
            {loading ? (
              <span className="lobby-spinner" />
            ) : tab === 'create' ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create Room
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 8l4-3v6L6 8z" fill="currentColor"/>
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Join Room
              </>
            )}
          </button>
        </form>

        <p className="lobby-footer">
          Up to 6 people per room · No account needed
        </p>
      </div>
    </div>
  );
}
