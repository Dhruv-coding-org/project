import React, { useState } from 'react';
import { type UserProfile, getProfiles, createProfile, deleteProfile, setActiveProfileId, BADGE_REGISTRY } from '../store/profileStore';

interface ProfileModalProps {
  activeProfile: UserProfile;
  totalLevels: number;
  onSelectProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

const AVATAR_OPTIONS = ['👨‍💻', '👩‍💻', '🚀', '🦊', '🐱', '⚡', '🧠', '🔥', '🌟', '🤖', '👾', '🧑‍🚀'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  activeProfile,
  totalLevels,
  onSelectProfile,
  onClose,
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => getProfiles());
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🚀');

  const handleSwitch = (p: UserProfile) => {
    setActiveProfileId(p.id);
    onSelectProfile(p);
    onClose();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = createProfile(newName, selectedAvatar);
    setProfiles(getProfiles());
    onSelectProfile(created);
    setIsCreating(false);
    setNewName('');
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this profile? Progress will be lost.')) {
      const updated = deleteProfile(id);
      setProfiles(updated);
      const stillExists = updated.find((p) => p.id === activeProfile.id);
      if (!stillExists && updated.length > 0) {
        onSelectProfile(updated[0]);
      }
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <div className="modal-title-row">
            <span className="modal-icon">👥</span>
            <h3>Player Profile & Achievement System</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">✕</button>
        </div>

        <p className="profile-subtitle">
          Switch profiles to let different people track their own Git mastery, completed levels, and rank titles independently on this machine!
        </p>

        {!isCreating ? (
          <>
            <div className="profiles-list">
              {profiles.map((p) => {
                const isActive = p.id === activeProfile.id;
                const completedCount = p.completedLevelIds.length;
                const progressPct = Math.min(100, Math.round((completedCount / totalLevels) * 100));

                return (
                  <div
                    key={p.id}
                    className={`profile-card ${isActive ? 'active-profile-card' : ''}`}
                    onClick={() => handleSwitch(p)}
                  >
                    <div className="profile-card-left">
                      <div className="profile-avatar">{p.avatar}</div>
                      <div className="profile-info">
                        <div className="profile-name-row">
                          <span className="profile-name">{p.name}</span>
                          <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', padding: '1px 6px', fontWeight: 600 }}>
                            Lvl {p.level || 1}
                          </span>
                          {isActive && <span className="active-pill">Currently Playing ★</span>}
                        </div>
                        <div className="profile-rank">{p.title} <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>({p.xp || 0} XP)</span></div>
                        <div className="profile-progress-bar-wrap">
                          <div className="profile-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="profile-card-right">
                      <span className="completed-stats">
                        🏆 {completedCount}/{totalLevels} Levels
                      </span>
                      {profiles.length > 1 && !isActive && (
                        <button
                          className="delete-profile-btn"
                          onClick={(e) => handleDelete(p.id, e)}
                          title="Delete Profile"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Achievement Badges Grid */}
            <div style={{ margin: '20px 0', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ fontSize: '14px', color: '#38BDF8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎖️</span> Achievement Badges ({activeProfile.badges?.length || 0} / {BADGE_REGISTRY.length} Unlocked)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
                {BADGE_REGISTRY.map((b) => {
                  const isUnlocked = activeProfile.badges?.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      style={{
                        background: isUnlocked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 41, 59, 0.4)',
                        border: `1px solid ${isUnlocked ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        opacity: isUnlocked ? 1 : 0.45,
                        filter: isUnlocked ? 'none' : 'grayscale(1)',
                      }}
                    >
                      <div style={{ fontSize: '24px' }}>{b.icon}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: isUnlocked ? '#34D399' : '#94A3B8' }}>
                          {b.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.2' }}>
                          {b.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button className="create-profile-btn" onClick={() => setIsCreating(true)}>
              ➕ Create New Profile
            </button>
          </>
        ) : (
          <form className="create-profile-form" onSubmit={handleCreate}>
            <h4 className="create-title">Create New Player Profile</h4>
            <div className="form-group">
              <label>Select Avatar:</label>
              <div className="avatars-grid">
                {AVATAR_OPTIONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className={`avatar-option-btn ${selectedAvatar === em ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Player Name / Nickname:</label>
              <input
                type="text"
                className="profile-name-input"
                placeholder="e.g. Dhruv Git Wizard"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setIsCreating(false)}>
                Cancel
              </button>
              <button type="submit" className="submit-create-btn">
                ✨ Save & Switch
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
