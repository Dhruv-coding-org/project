import { useState } from 'react';
import type { UserProfile } from '../../types';
import { AVATAR_PRESETS } from '../../constants/avatars';
import './ProfileModal.css';

interface ProfileModalProps {
  currentProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
}

export function ProfileModal({ currentProfile, onSave, onClose }: ProfileModalProps) {
  const [username, setUsername] = useState(currentProfile.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentProfile.avatar || '🍿');
  const [statusMessage, setStatusMessage] = useState(currentProfile.statusMessage || '');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a display name.');
      return;
    }
    onSave({
      username: trimmed,
      avatar: selectedAvatar,
      statusMessage: statusMessage.trim()
    });
    onClose();
  }

  return (
    <div className="profile-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="profile-modal glass animate-slide-up">
        <div className="profile-header">
          <h2>
            <span className="profile-header-avatar">{selectedAvatar}</span>
            User Profile Settings
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Display name */}
          <div className="profile-field">
            <label htmlFor="profile-name-input" className="profile-label">Display Name</label>
            <input
              id="profile-name-input"
              className="input"
              type="text"
              placeholder="Your username..."
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              maxLength={20}
              required
            />
          </div>

          {/* Status Message */}
          <div className="profile-field">
            <label htmlFor="profile-status-input" className="profile-label">Status Message (optional)</label>
            <input
              id="profile-status-input"
              className="input"
              type="text"
              placeholder='e.g. "Watching Sci-Fi", "Muted", "BRB"'
              value={statusMessage}
              onChange={e => setStatusMessage(e.target.value)}
              maxLength={30}
            />
          </div>

          {/* Avatar selector */}
          <div className="profile-field">
            <label className="profile-label">Choose Avatar Icon</label>
            <div className="avatar-grid">
              {AVATAR_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  className={`avatar-option ${selectedAvatar === preset.icon ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(preset.icon)}
                  title={preset.label}
                >
                  <span className="avatar-emoji">{preset.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="profile-error">{error}</p>}

          <div className="profile-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
