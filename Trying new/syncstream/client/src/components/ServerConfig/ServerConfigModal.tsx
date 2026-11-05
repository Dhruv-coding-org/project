import { useState, useEffect } from 'react';
import { getServerUrl, setCustomServerUrl, CLOUD_SERVER_URL, LOCAL_SERVER_URL } from '../../socket';
import './ServerConfigModal.css';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServerConfigModal({ isOpen, onClose }: ServerConfigModalProps) {
  if (!isOpen) return null;

  return <ServerConfigModalContent onClose={onClose} />;
}

function ServerConfigModalContent({ onClose }: { onClose: () => void }) {
  const [serverUrl, setServerUrl] = useState(() => getServerUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('checking');
  const [serverDetails, setServerDetails] = useState<{ status?: string; activeRooms?: number } | null>(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const target = getServerUrl().replace(/\/+$/, '');
    fetch(`${target}/`, { signal: controller.signal })
      .then(async (res) => {
        if (ignore) return;
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setServerDetails(data);
            setTestingStatus('online');
          }
        } else {
          setTestingStatus('offline');
        }
      })
      .catch(() => {
        if (!ignore) {
          setTestingStatus('offline');
        }
      })
      .finally(() => {
        clearTimeout(timeout);
      });

    return () => {
      ignore = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  async function checkServerHealth(url: string) {
    setTestingStatus('checking');
    setServerDetails(null);
    try {
      const target = url.replace(/\/+$/, '');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${target}/`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        setServerDetails(data);
        setTestingStatus('online');
      } else {
        setTestingStatus('offline');
      }
    } catch {
      setTestingStatus('offline');
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setCustomServerUrl(serverUrl);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  }

  function handleSelectPreset(presetUrl: string) {
    setServerUrl(presetUrl);
    checkServerHealth(presetUrl);
  }

  function handleReset() {
    setCustomServerUrl('');
    const defaultUrl = getServerUrl();
    setServerUrl(defaultUrl);
    checkServerHealth(defaultUrl);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  }

  const isCloud = serverUrl.includes('onrender.com') || serverUrl === CLOUD_SERVER_URL;
  const isLocal = serverUrl.includes('localhost:3001') || serverUrl.includes('127.0.0.1:3001');

  return (
    <div className="server-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="server-modal glass animate-scale-spring" onClick={e => e.stopPropagation()}>
        <div className="server-modal-header">
          <div className="server-header-title">
            <span className="server-header-icon">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6"/>
                <path d="M2 8h12M8 2c2 2.5 2 9.5 0 12M8 2c-2 2.5-2 9.5 0 12"/>
              </svg>
            </span>
            <div>
              <h2>Backend Server Connection</h2>
              <p>Sync Desktop App and Website across devices</p>
            </div>
          </div>
          <button className="btn-icon shortcuts-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave} className="server-modal-body">
          {/* Quick Preset Selector */}
          <div className="server-presets-group">
            <label className="lobby-label">Connection Mode Presets:</label>
            <div className="server-preset-buttons">
              <button
                type="button"
                className={`server-preset-card ${isCloud ? 'active' : ''}`}
                onClick={() => handleSelectPreset(CLOUD_SERVER_URL)}
              >
                <div className="preset-top">
                  <span className="preset-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 12h8a3 3 0 00.5-5.96A4.5 4.5 0 004.5 7.5 3 3 0 004 12z"/>
                    </svg>
                  </span>
                  <span className="preset-title">Cloud Server</span>
                  <span className="badge badge-accent">Sync Mode</span>
                </div>
                <p className="preset-desc">Connects Desktop App & Website together across the internet via Render.</p>
              </button>

              <button
                type="button"
                className={`server-preset-card ${isLocal ? 'active' : ''}`}
                onClick={() => handleSelectPreset(LOCAL_SERVER_URL)}
              >
                <div className="preset-top">
                  <span className="preset-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="3" width="12" height="8" rx="1.5"/>
                      <line x1="1" y1="13" x2="15" y2="13"/>
                    </svg>
                  </span>
                  <span className="preset-title">Localhost Server</span>
                </div>
                <p className="preset-desc">Runs strictly on this PC (offline / local development on port 3001).</p>
              </button>
            </div>
          </div>

          <div className="form-group">
            <div className="server-url-header">
              <label className="lobby-label">Active Server Endpoint:</label>
              <button
                type="button"
                className="server-test-btn"
                onClick={() => checkServerHealth(serverUrl)}
                disabled={testingStatus === 'checking'}
              >
                {testingStatus === 'checking' ? 'Testing…' : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 8a7 7 0 0113-3M15 8a7 7 0 01-13 3"/>
                      <polyline points="14 2 14 5 11 5"/>
                      <polyline points="2 14 2 11 5 11"/>
                    </svg>
                    Test Ping
                  </span>
                )}
              </button>
            </div>
            <input
              type="text"
              className="input input-mono"
              value={serverUrl}
              onChange={e => {
                setServerUrl(e.target.value);
                setTestingStatus('idle');
              }}
              placeholder="e.g. https://sync-stream-ag16.onrender.com"
              required
            />
          </div>

          {/* Health Status Indicator */}
          <div className={`server-status-banner ${testingStatus}`}>
            {testingStatus === 'checking' && (
              <span>Testing connection to server…</span>
            )}
            {testingStatus === 'online' && (
              <span>
                <span className="status-indicator-dot online" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', marginRight: '6px' }} />
                <strong>Server Online</strong> — {serverDetails?.activeRooms !== undefined ? `${serverDetails.activeRooms} active room(s) running` : 'Ready to sync rooms'}
              </span>
            )}
            {testingStatus === 'offline' && (
              <span>
                <span className="status-indicator-dot offline" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', marginRight: '6px' }} />
                <strong>Server Unreachable</strong> — Check URL or backend status.
              </span>
            )}
            {testingStatus === 'idle' && (
              <span>Click "Test Ping" or save to connect.</span>
            )}
          </div>

          <div className="server-tip-box">
            <p><strong>To connect Desktop App & Website together:</strong></p>
            <ul>
              <li>Both your Desktop App and the Live Website must be connected to the <strong>Cloud Server</strong>.</li>
              <li>When both use <code>{CLOUD_SERVER_URL}</code>, rooms created on the Desktop App are instantly accessible on the Website, and vice-versa!</li>
            </ul>
          </div>

          {savedSuccess && (
            <div className="server-save-toast animate-fade-in">
              ✓ Server URL saved! Reconnecting socket…
            </div>
          )}

          <div className="server-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={handleReset}>
              Reset to Cloud Default
            </button>
            <button type="submit" className="btn btn-primary">
              Save & Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
