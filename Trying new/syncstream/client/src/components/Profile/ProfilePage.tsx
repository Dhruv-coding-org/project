import { useState, useEffect } from 'react';
import { getProfileDB, saveProfileDB, getStarredVideosDB, unstarVideoDB } from '../../db/db';
import type { UserProfileDB, StarredVideoDB } from '../../db/db';
import { AVATAR_PRESETS } from '../../constants/avatars';
import './ProfilePage.css';

interface ProfilePageProps {
  onBack: () => void;
  onLaunchVideo?: (source: { sourceType: 'url' | 'file'; url: string; title: string }) => void;
}

export function ProfilePage({ onBack, onLaunchVideo }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfileDB>({
    id: 'default',
    username: '',
    avatar: '🍿',
    bio: '',
    statusMessage: '',
    theme: 'dark-void',
    // eslint-disable-next-line react-hooks/purity
    updatedAt: Date.now(),
  });
  const [starredVideos, setStarredVideos] = useState<StarredVideoDB[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'starred'>('profile');
  const [savedToast, setSavedToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getProfileDB().then(p => {
      if (p) setProfile(p);
    });
    getStarredVideosDB().then(list => setStarredVideos(list));
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    await saveProfileDB(profile);
    // Apply theme
    document.documentElement.setAttribute('data-theme', profile.theme || 'dark-void');
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  }

  async function handleRemoveStar(id: string) {
    await unstarVideoDB(id);
    setStarredVideos(prev => prev.filter(item => item.id !== id));
  }

  const filteredStarred = starredVideos.filter(v =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="profile-page animate-fade-in">
      {/* Toast Notification */}
      {savedToast && (
        <div className="toast-container">
          <div className="toast toast-success animate-slide-up">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Profile settings saved!
          </div>
        </div>
      )}

      {/* Profile Header Bar */}
      <header className="profile-navbar glass">
        <div className="profile-navbar-brand">
          <button className="btn-icon profile-back-btn" onClick={onBack} title="Back to App">
            ← Back
          </button>
          <span className="profile-navbar-title">User Profile & Favorites Library</span>
        </div>
      </header>

      <main className="profile-content">
        {/* Profile Card Summary Banner */}
        <div className="profile-banner-card glass animate-scale-spring">
          <div className="profile-avatar-large">
            {profile.avatar}
          </div>
          <div className="profile-banner-info">
            <h2>{profile.username || 'SyncStream Watcher'}</h2>
            <p className="profile-bio-text">{profile.bio || 'Lover of movies, streams, and synchronized watch parties.'}</p>
            <div className="profile-meta-chips">
              <span className="badge badge-accent">⭐ {starredVideos.length} Starred Videos</span>
              <span className="badge badge-success">⚡ Active Profile</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs" role="tablist">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile Settings
          </button>
          <button
            className={`profile-tab ${activeTab === 'starred' ? 'active' : ''}`}
            onClick={() => setActiveTab('starred')}
          >
            ⭐ Starred Library ({starredVideos.length})
          </button>
        </div>

        {/* Profile Settings Tab */}
        {activeTab === 'profile' && (
          <form className="profile-form glass animate-fade-in" onSubmit={handleSaveProfile}>
            <div className="profile-form-grid">
              <div className="form-group profile-field">
                <label className="label">Display Name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Enter display name…"
                  value={profile.username}
                  onChange={e => setProfile({ ...profile, username: e.target.value })}
                  maxLength={25}
                  required
                />
              </div>

              <div className="form-group profile-field">
                <label className="label">Status Message</label>
                <input
                  className="input"
                  type="text"
                  placeholder='e.g. "Watching Sci-Fi 🍿", "Ready!"'
                  value={profile.statusMessage || ''}
                  onChange={e => setProfile({ ...profile, statusMessage: e.target.value })}
                  maxLength={40}
                />
              </div>

              <div className="form-group profile-field full-width">
                <label className="label">Personal Bio</label>
                <textarea
                  className="input profile-textarea"
                  placeholder="Tell others what movies or streams you enjoy watching…"
                  value={profile.bio || ''}
                  onChange={e => setProfile({ ...profile, bio: e.target.value })}
                  maxLength={150}
                  rows={3}
                />
              </div>

              {/* Avatar Selector */}
              <div className="form-group profile-field full-width">
                <label className="label">Avatar Selection ({profile.avatar})</label>
                <div className="profile-avatar-picker">
                  {AVATAR_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`profile-avatar-item ${profile.avatar === preset.icon ? 'selected' : ''}`}
                      onClick={() => setProfile({ ...profile, avatar: preset.icon })}
                      title={preset.label}
                    >
                      {preset.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Preference Switcher */}
              <div className="form-group profile-field full-width">
                <label className="label">App Aesthetic Theme</label>
                <div className="profile-theme-grid">
                  <button
                    type="button"
                    className={`theme-card ${profile.theme === 'dark-void' ? 'selected' : ''}`}
                    onClick={() => setProfile({ ...profile, theme: 'dark-void' })}
                  >
                    <span className="theme-preview dark-void-preview" />
                    <span className="theme-name">🌌 Dark Void Space</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-card ${profile.theme === 'cyber-neon' ? 'selected' : ''}`}
                    onClick={() => setProfile({ ...profile, theme: 'cyber-neon' })}
                  >
                    <span className="theme-preview cyber-neon-preview" />
                    <span className="theme-name">🌆 Cyber Neon</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-card ${profile.theme === 'midnight-minimal' ? 'selected' : ''}`}
                    onClick={() => setProfile({ ...profile, theme: 'midnight-minimal' })}
                  >
                    <span className="theme-preview midnight-preview" />
                    <span className="theme-name">🌙 Midnight Minimal</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="profile-form-actions">
              <button type="submit" className="btn btn-primary profile-submit-btn">
                💾 Save Profile Changes
              </button>
            </div>
          </form>
        )}

        {/* Starred Videos Tab */}
        {activeTab === 'starred' && (
          <div className="profile-starred-container animate-fade-in">
            <div className="profile-starred-header">
              <input
                className="input profile-starred-search"
                type="text"
                placeholder="Search starred videos…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredStarred.length === 0 ? (
              <div className="profile-starred-empty glass">
                <span className="empty-icon">⭐</span>
                <h3>No Starred Videos Saved Yet</h3>
                <p>Click the ⭐ Star button on any video in a watch party to save it to your library for instant access anytime!</p>
              </div>
            ) : (
              <div className="profile-starred-grid">
                {filteredStarred.map(video => (
                  <div key={video.id} className="starred-video-card glass">
                    <div className="starred-card-icon">
                      {video.sourceType === 'url' ? '🌐' : '📁'}
                    </div>
                    <div className="starred-card-info">
                      <h4 className="starred-title">{video.title}</h4>
                      <span className="starred-url">{video.url}</span>
                      <span className="starred-date">
                        Starred: {new Date(video.dateStarred).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="starred-card-actions">
                      {onLaunchVideo && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onLaunchVideo({ sourceType: video.sourceType, url: video.url, title: video.title })}
                          title="Play video in room"
                        >
                          ▶️ Launch
                        </button>
                      )}
                      <button
                        className="btn-icon starred-remove-btn"
                        onClick={() => handleRemoveStar(video.id)}
                        title="Remove from starred"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
