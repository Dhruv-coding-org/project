import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { getSavedProfile } from '../../hooks/useRoom';
import { AVATAR_PRESETS } from '../../constants/avatars';
import { LobbyCardSkeleton } from '../Skeleton/Skeleton';
import { ShortcutsModal } from '../Shortcuts/ShortcutsModal';
import { ServerConfigModal } from '../ServerConfig/ServerConfigModal';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { getServerUrl } from '../../socket';
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

function getInitialRoomParam(): { tab: Tab; code: string } {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room') || params.get('code');
      if (urlRoom) {
        return { tab: 'join', code: urlRoom.toUpperCase() };
      }
    }
  } catch {
    // Ignore
  }
  return { tab: 'create', code: '' };
}

export function Lobby({ onCreateRoom, onJoinRoom, onOpenProfile }: LobbyProps) {
  const saved = getSavedProfile();
  const initialParam = getInitialRoomParam();
  const [tab, setTab] = useState<Tab>(initialParam.tab);
  const [username, setUsername] = useState(saved.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(saved.avatar || '🍿');
  const [statusMessage, setStatusMessage] = useState(saved.statusMessage || '');
  const [roomCode, setRoomCode] = useState(initialParam.code);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>(() => getRecentRooms());
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 350);
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
        setRecentRooms(getRecentRooms());
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
      {/* Top Landing Navigation Header */}
      <header className="lobby-navbar animate-slide-down">
        <div className="lobby-navbar-brand">
          <div className="lobby-navbar-logo">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2"/>
              <path d="M11 9.5L19 14L11 18.5V9.5Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="lobby-navbar-title">SyncStream</span>
          <span className="navbar-badge">STUDIO</span>
        </div>

        <div className="lobby-navbar-actions">
          {onOpenProfile && (
            <button
              className="btn btn-ghost lobby-nav-btn"
              onClick={onOpenProfile}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="8" cy="5" r="3"/>
                <path d="M2.5 14c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5"/>
              </svg>
              <span>Profile</span>
            </button>
          )}
          <button
            className="btn btn-ghost lobby-nav-btn"
            onClick={() => setShowFeaturesModal(true)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="2" y="3" width="12" height="10" rx="1.5"/>
              <path d="M6 7l4 2.5L6 12V7z"/>
            </svg>
            <span>Features</span>
          </button>
          <button
            className="btn btn-ghost lobby-nav-btn"
            onClick={() => setShowShortcutsModal(true)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="1.5" y="4" width="13" height="8" rx="1.5"/>
              <path d="M4 7h1M7 7h1M10 7h2M4 9.5h8"/>
            </svg>
            <span>Shortcuts</span>
          </button>
          <button
            className="btn btn-ghost lobby-nav-btn"
            onClick={() => setShowServerModal(true)}
            title="Configure Server URL for global/cloud streaming"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="8" cy="8" r="6"/>
              <path d="M2 8h12M8 2c2 2.5 2 9.5 0 12M8 2c-2 2.5-2 9.5 0 12"/>
            </svg>
            <span>Server</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {showSkeleton ? (
        <LobbyCardSkeleton />
      ) : (
        <div className="lobby-card animate-scale-spring">
          {/* Main Logo & Tagline */}
          <div className="lobby-logo">
            <div className="lobby-logo-icon">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2"/>
                <path d="M11 9.5L19 14L11 18.5V9.5Z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h1 className="lobby-logo-name">SyncStream</h1>
              <p className="lobby-logo-tagline">
                Synchronized multimedia watch parties and real-time voice channel
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

          {/* Recent Rooms Quick Access */}
          {recentRooms.length > 0 && (
            <div className="lobby-recent-section animate-fade-in">
              <span className="lobby-recent-label">Recent Rooms</span>
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
            <div className="lobby-field">
              <label htmlFor="username-input" className="lobby-label">
                Display Name <span className="required-star">*</span>
              </label>
              <input
                id="username-input"
                className="input"
                type="text"
                placeholder="e.g. Alex, Morgan"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                maxLength={20}
                required
                autoFocus
              />
            </div>

            <div className="lobby-field">
              <label htmlFor="status-input" className="lobby-label">Status Message (optional)</label>
              <input
                id="status-input"
                className="input"
                type="text"
                placeholder='e.g. "Ready for movie night", "Headphones on"'
                value={statusMessage}
                onChange={e => setStatusMessage(e.target.value)}
                maxLength={35}
              />
            </div>

            {/* Avatar Picker */}
            <div className="lobby-field">
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
              <div className="lobby-field animate-slide-up">
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
              <div className="lobby-error animate-fade-in" role="alert" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 3.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  <span>{error}</span>
                </div>
                {(error.toLowerCase().includes('server') || error.toLowerCase().includes('connection timed out') || error.toLowerCase().includes('room not found')) && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowServerModal(true)}
                    style={{ fontSize: '0.78rem', padding: '3px 8px', alignSelf: 'flex-end', textDecoration: 'underline' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ marginRight: '4px' }}>
                      <circle cx="8" cy="8" r="3"/>
                      <path d="M8 1v2M8 13v2M1 8h2M13 8h2"/>
                    </svg>
                    Check Server Connection ({getServerUrl().replace(/^https?:\/\//, '').split('/')[0]})
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary lobby-submit"
              disabled={loading}
              id="lobby-submit-btn"
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="lobby-spinner" />
                  {tab === 'create' ? 'Initializing Room…' : 'Connecting to Room…'}
                </span>
              ) : (
                tab === 'create' ? 'Launch Watch Party' : 'Enter Watch Party'
              )}
            </button>
          </form>

          {/* Quick instructions & security badge */}
          <div className="lobby-footer">
            <span className="lobby-footer-item">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="2" y="6" width="10" height="7" rx="1.5"/>
                <path d="M4.5 6V4a2.5 2.5 0 015 0v2"/>
              </svg>
              P2P Audio Mesh
            </span>
            <span>•</span>
            <span className="lobby-footer-item">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                <circle cx="7" cy="7" r="5.5"/>
                <path d="M7 4v3.5l2 1.5"/>
              </svg>
              Sub-10ms Latency
            </span>
            <span>•</span>
            <span className="lobby-footer-item">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                <circle cx="5" cy="5" r="2.5"/>
                <circle cx="10" cy="6" r="2"/>
                <path d="M1.5 12c0-2 1.8-3 3.5-3s3.5 1 3.5 3"/>
              </svg>
              Collaborative Queue
            </span>
          </div>
        </div>
      )}

      {/* Features Showcase Modal */}
      {showFeaturesModal && (
        <div className="shortcuts-backdrop animate-fade-in" onClick={() => setShowFeaturesModal(false)}>
          <div className="shortcuts-modal glass animate-scale-spring" onClick={e => e.stopPropagation()}>
            <div className="shortcuts-header">
              <div className="shortcuts-header-title">
                <div className="feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <div>
                  <h2>SyncStream Platform Features</h2>
                  <p>Next-generation synchronized media experience</p>
                </div>
              </div>
              <button className="btn-icon shortcuts-close-btn" onClick={() => setShowFeaturesModal(false)}>✕</button>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="2" width="20" height="20" rx="2.18"/>
                    <line x1="7" y1="2" x2="7" y2="22"/>
                    <line x1="17" y1="2" x2="17" y2="22"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <line x1="2" y1="7" x2="7" y2="7"/>
                    <line x1="2" y1="17" x2="7" y2="17"/>
                    <line x1="17" y1="17" x2="22" y2="17"/>
                    <line x1="17" y1="7" x2="22" y2="7"/>
                  </svg>
                </div>
                <h3>Universal Video Playback</h3>
                <p>Support for MP4/WebM direct URLs, YouTube, Vimeo, and local media files with zero server uploading needed.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <h3>Sub-10ms Sync Engine</h3>
                <p>Automated drift compensation keeps playback in lockstep across all participants.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                    <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </div>
                <h3>HD WebRTC Voice Grid</h3>
                <p>Built-in noise suppression, live audio volume visualizers, active speaker aura indicators, and deafen controls.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <h3>Cinema Theater Mode</h3>
                <p>Focused widescreen player layout with collapsible sidebar for uninterrupted watching.</p>
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
