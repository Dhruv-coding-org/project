import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { getSavedProfile } from '../../hooks/useRoom';
import { AVATAR_PRESETS } from '../../constants/avatars';
import { LobbyCardSkeleton } from '../Skeleton/Skeleton';
import { ShortcutsModal } from '../Shortcuts/ShortcutsModal';
import { ServerConfigModal } from '../ServerConfig/ServerConfigModal';
import './Lobby.css';

interface LobbyProps {
  onCreateRoom: (username: string, avatar?: string, statusMessage?: string) => Promise<void>;
  onJoinRoom: (username: string, roomCode: string, avatar?: string, statusMessage?: string) => Promise<void>;
  onOpenProfile?: () => void;
}

type Tab = 'create' | 'join';

interface RecentRoom {
  code: string;
  time: string;
}

const RECENT_ROOMS_KEY = 'syncstream_recent_rooms';

function getRecentRooms(): RecentRoom[] {
  try {
    const raw = localStorage.getItem(RECENT_ROOMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentRoom(code: string) {
  try {
    const list = getRecentRooms().filter(r => r.code !== code);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = [{ code, time: now }, ...list].slice(0, 5);
    localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function Lobby({ onCreateRoom, onJoinRoom, onOpenProfile }: LobbyProps) {
  const saved = getSavedProfile();
  const [tab, setTab] = useState<Tab>('create');
  const [username, setUsername] = useState(saved.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(saved.avatar || '🍿');
  const [statusMessage, setStatusMessage] = useState(saved.statusMessage || '');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 350);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentRooms(getRecentRooms());

    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlRoom = params.get('room') || params.get('code');
        if (urlRoom) {
          setTab('join');
          setRoomCode(urlRoom.toUpperCase());
        }
      }
    } catch (e) {
      console.debug('Failed to parse URL room param:', e);
    }

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
        const cleanedCode = roomCode.trim().toUpperCase();
        saveRecentRoom(cleanedCode);
        await onJoinRoom(username.trim(), cleanedCode, selectedAvatar, statusMessage.trim());
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickJoinRecent(code: string) {
    setTab('join');
    setRoomCode(code);
  }

  return (
    <div className="lobby">
      {/* Background ambient light mesh & glowing orbs */}
      <div className="lobby-orb lobby-orb-1" />
      <div className="lobby-orb lobby-orb-2" />
      <div className="lobby-orb lobby-orb-3" />

      {/* Top Landing Navigation Header */}
      <header className="lobby-navbar animate-slide-down">
        <div className="lobby-navbar-brand">
          <div className="lobby-navbar-logo">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="url(#gl-nav)" strokeWidth="2"/>
              <path d="M11 9.5L19 14L11 18.5V9.5Z" fill="url(#gl-nav)"/>
              <defs>
                <linearGradient id="gl-nav" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c3aed"/><stop offset="1" stopColor="#22d3ee"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="lobby-navbar-title">SyncStream</span>
          <span className="badge badge-accent navbar-badge">v3.0 PRO</span>
        </div>

        <div className="lobby-navbar-actions">
          {onOpenProfile && (
            <button
              className="btn btn-ghost lobby-nav-btn"
              onClick={onOpenProfile}
            >
              👤 Profile
            </button>
          )}
          <button
            className="btn btn-ghost lobby-nav-btn"
            onClick={() => setShowFeaturesModal(true)}
          >
            ✨ Features
          </button>
          <button
            className="btn btn-ghost lobby-nav-btn"
            onClick={() => setShowShortcutsModal(true)}
          >
            ⌨️ Shortcuts
          </button>
          <button
            className="btn btn-ghost lobby-nav-btn"
            onClick={() => setShowServerModal(true)}
            title="Configure Server URL for global/cloud streaming"
          >
            🌐 Server
          </button>
        </div>
      </header>

      {showSkeleton ? (
        <LobbyCardSkeleton />
      ) : (
        <div className="lobby-card animate-scale-spring glass">
          {/* Main Logo & Tagline */}
          <div className="lobby-logo">
            <div className="lobby-logo-icon">
              <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
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
              <h1 className="lobby-title lobby-logo-name">SyncStream</h1>
              <p className="lobby-subtitle lobby-logo-tagline">
                Ultra-low latency synchronized watch parties & voice chat
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="lobby-tabs" role="tablist">
            <button
              className={`lobby-tab ${tab === 'create' ? 'active' : ''}`}
              onClick={() => { setTab('create'); setError(''); }}
              role="tab"
              aria-selected={tab === 'create'}
              id="tab-create-room"
            >
              ✦ Create Room
            </button>
            <button
              className={`lobby-tab ${tab === 'join' ? 'active' : ''}`}
              onClick={() => { setTab('join'); setError(''); }}
              role="tab"
              aria-selected={tab === 'join'}
              id="tab-join-room"
            >
              🚀 Join Room
            </button>
          </div>

          {/* Recent Rooms Quick Access */}
          {recentRooms.length > 0 && (
            <div className="lobby-recent-section animate-fade-in">
              <span className="lobby-recent-label">Recent Rooms:</span>
              <div className="lobby-recent-chips">
                {recentRooms.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    className="lobby-recent-chip"
                    onClick={() => handleQuickJoinRecent(r.code)}
                    title={`Click to fill room code ${r.code}`}
                  >
                    <span className="recent-code">{r.code}</span>
                    <span className="recent-time">{r.time}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form className="lobby-form" onSubmit={handleSubmit}>
            <div className="form-group lobby-field">
              <label htmlFor="username-input" className="lobby-label">
                Display Name <span className="required-star">*</span>
              </label>
              <input
                id="username-input"
                className="input"
                type="text"
                placeholder="e.g. Alex, CyberNaut…"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                maxLength={20}
                required
                autoFocus
              />
            </div>

            <div className="form-group lobby-field">
              <label htmlFor="status-input" className="lobby-label">Status Message (optional)</label>
              <input
                id="status-input"
                className="input"
                type="text"
                placeholder='e.g. "Watching Sci-Fi 🍿", "Ready!"'
                value={statusMessage}
                onChange={e => setStatusMessage(e.target.value)}
                maxLength={35}
              />
            </div>

            {/* Avatar Picker */}
            <div className="form-group lobby-field">
              <label className="lobby-label">Choose Avatar ({selectedAvatar})</label>
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
              <div className="form-group lobby-field animate-slide-up">
                <label htmlFor="roomcode-input" className="lobby-label">Room Code</label>
                <input
                  id="roomcode-input"
                  className="input input-mono lobby-code-input"
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
              className="btn btn-primary lobby-submit"
              disabled={loading}
              id="lobby-submit-btn"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="lobby-spinner" />
                  {tab === 'create' ? 'Initializing Room…' : 'Connecting to Room…'}
                </span>
              ) : (
                tab === 'create' ? '✦ Launch Watch Party' : '🚀 Enter Watch Party'
              )}
            </button>
          </form>

          {/* Quick instructions & security badge */}
          <div className="lobby-footer">
            <p>🔒 End-to-end P2P Audio • ⚡ Real-Time Latency Sync • 🍿 Up to 6 Watchers</p>
          </div>
        </div>
      )}

      {/* Features Showcase Modal */}
      {showFeaturesModal && (
        <div className="shortcuts-backdrop animate-fade-in" onClick={() => setShowFeaturesModal(false)}>
          <div className="shortcuts-modal glass animate-scale-spring" onClick={e => e.stopPropagation()}>
            <div className="shortcuts-header">
              <div className="shortcuts-header-title">
                <span className="shortcuts-icon">⚡</span>
                <div>
                  <h2>SyncStream Platform Features</h2>
                  <p>Next-generation synchronized media experience</p>
                </div>
              </div>
              <button className="btn-icon shortcuts-close-btn" onClick={() => setShowFeaturesModal(false)}>✕</button>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <span className="feature-icon">🎬</span>
                <h3>Universal Video Playback</h3>
                <p>Support for MP4/WebM direct URLs, YouTube, Vimeo, and local video files with zero server uploading needed.</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">⏱️</span>
                <h3>Sub-10ms Sync Engine</h3>
                <p>Automated drift compensation keeps playback in micro-second lockstep across all participants.</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">🎙️</span>
                <h3>HD WebRTC Voice Grid</h3>
                <p>Built-in noise suppression, live audio volume visualizers, active speaker aura indicators, and deafen controls.</p>
              </div>
              <div className="feature-card">
                <span className="feature-icon">✨</span>
                <h3>Ambilight & Theater Mode</h3>
                <p>Dynamic back-glow canvas bleeding and 1-click immersive Cinema Theater Mode.</p>
              </div>
            </div>
            <div className="shortcuts-footer">
              <button className="btn btn-primary" onClick={() => setShowFeaturesModal(false)}>Explore SyncStream</button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} />

      {/* Backend Server Connection Modal */}
      <ServerConfigModal isOpen={showServerModal} onClose={() => setShowServerModal(false)} />
    </div>
  );
}
