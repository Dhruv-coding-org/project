import { useState } from 'react';
import { getServerUrl, setCustomServerUrl } from '../../socket';
import './ServerConfigModal.css';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServerConfigModal({ isOpen, onClose }: ServerConfigModalProps) {
  const [serverUrl, setServerUrl] = useState(getServerUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setCustomServerUrl(serverUrl);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  }

  function handleReset() {
    setCustomServerUrl('');
    setServerUrl(getServerUrl());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  }

  return (
    <div className="server-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="server-modal glass animate-scale-spring" onClick={e => e.stopPropagation()}>
        <div className="server-modal-header">
          <div className="server-header-title">
            <span className="server-header-icon">🌐</span>
            <div>
              <h2>Backend Server Connection</h2>
              <p>Configure the Socket.IO & Streaming Server URL</p>
            </div>
          </div>
          <button className="btn-icon shortcuts-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave} className="server-modal-body">
          <div className="form-group">
            <label className="lobby-label">
              Active Server URL:
            </label>
            <input
              type="text"
              className="input"
              value={serverUrl}
              onChange={e => setServerUrl(e.target.value)}
              placeholder="e.g. http://192.168.1.6:3001 or https://syncstream.loca.lt"
              required
            />
          </div>

          <div className="server-tip-box">
            <p>💡 <strong>When using Vercel or sharing globally:</strong></p>
            <ul>
              <li>Vercel hosts the web frontend. To sync rooms and chat across the web, connect to a running SyncStream backend (like your host's <strong>Localtunnel URL</strong> or a free <strong>Render.com</strong> backend).</li>
              <li>When joining on the same Wi-Fi, use your laptop's LAN IP: <code>http://192.168.x.x:3001</code>.</li>
            </ul>
          </div>

          {savedSuccess && (
            <div className="server-save-toast animate-fade-in">
              ✓ Server URL saved! Reconnecting socket…
            </div>
          )}

          <div className="server-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={handleReset}>
              Reset to Default
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
