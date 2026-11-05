import { useState, useEffect } from 'react';
import { getProfileDB, saveProfileDB, getStarredVideosDB, unstarVideoDB } from '../../db/db';
import type { UserProfileDB, StarredVideoDB } from '../../db/db';
import { AVATAR_PRESETS } from '../../constants/avatars';
import { applyTheme, getSavedTheme } from '../../utils/theme';
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
    theme: getSavedTheme(),
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
    const resolvedTheme = (profile.theme === 'fire' || profile.theme === 'dark' || profile.theme === 'light') ? profile.theme : 'fire';
    applyTheme(resolvedTheme);
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
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 13L5 8l5-5"/>
            </svg>
            <span>Back</span>
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
              <span className="badge badge-accent">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '4px' }}>
                  <path d="M8 1l2.5 5h5.5l-4.5 3.5 1.5 5.5-5-3.5-5 3.5 1.5-5.5L0 6h5.5z"/>
                </svg>
                {starredVideos.length} Starred Videos
              </span>
              <span className="badge badge-success">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ marginRight: '4px' }}>
                  <polyline points="3 8 7 12 13 4"/>
                </svg>
                Active Profile
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs" role="tablist">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '6px' }}>
              <circle cx="8" cy="5" r="3"/>
              <path d="M2.5 14c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5"/>
            </svg>
            Profile Settings
          </button>
          <button
            className={`profile-tab ${activeTab === 'starred' ? 'active' : ''}`}
            onClick={() => setActiveTab('starred')}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '6px' }}>
              <polygon points="8 1 10.5 6 16 6 11.5 9.5 13 15 8 11.5 3 15 4.5 9.5 0 6 5.5 6 8 1"/>
            </svg>
            Starred Library ({starredVideos.length})
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
                    className={`theme-card ${profile.theme === 'fire' || (!profile.theme && getSavedTheme() === 'fire') ? 'selected' : ''}`}
                    onClick={() => {
                      setProfile({ ...profile, theme: 'fire' });
                      applyTheme('fire');
                    }}
                  >
                    <span className="theme-preview fiery-ember-preview" />
                    <span className="theme-name">Inferno (Coral Cinema)</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-card ${profile.theme === 'dark' ? 'selected' : ''}`}
                    onClick={() => {
                      setProfile({ ...profile, theme: 'dark' });
                      applyTheme('dark');
                    }}
                  >
                    <span className="theme-preview modern-dark-preview" />
                    <span className="theme-name">Modern Dark (Obsidian)</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-card ${profile.theme === 'light' ? 'selected' : ''}`}
                    onClick={() => {
                      setProfile({ ...profile, theme: 'light' });
                      applyTheme('light');
                    }}
                  >
                    <span className="theme-preview modern-light-preview" />
                    <span className="theme-name">Modern Light (Clean Slate)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="profile-form-actions">
              <button type="submit" className="btn btn-primary profile-submit-btn">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginRight: '6px' }}>
                  <path d="M13 14H3a1 1 0 01-1-1V3a1 1 0 011-1h7l4 4v7a1 1 0 01-1 1z"/>
                  <polyline points="10 2 10 6 6 6"/>
                  <rect x="5" y="9" width="6" height="5"/>
                </svg>
                Save Profile Changes
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
                <span className="empty-icon">
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="8 1 10.5 6 16 6 11.5 9.5 13 15 8 11.5 3 15 4.5 9.5 0 6 5.5 6 8 1"/>
                  </svg>
                </span>
                <h3>No Starred Videos Saved Yet</h3>
                <p>Click the Star button on any video in a watch party to save it to your library for instant access anytime.</p>
              </div>
            ) : (
              <div className="profile-starred-grid">
                {filteredStarred.map(video => (
                  <div key={video.id} className="starred-video-card glass">
                    <div className="starred-card-icon">
                      {video.sourceType === 'url' ? (
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="8" cy="8" r="6"/>
                          <path d="M2 8h12M8 2c2 2.5 2 9.5 0 12M8 2c-2 2.5-2 9.5 0 12"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 4a1 1 0 011-1h3.5l1.5 2H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"/>
                        </svg>
                      )}
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
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '4px' }}>
                            <polygon points="4 2 13 8 4 14"/>
                          </svg>
                          Launch
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
