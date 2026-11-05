'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({ 
    defaultTitle: '', 
    defaultDescription: '', 
    defaultHashtags: '#shorts #reels #viral #trending', 
    defaultPlatforms: ['youtube', 'instagram'] 
  });
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => { 
    fetch('/api/settings')
      .then(r => r.json())
      .then(setSettings)
      .catch((err) => console.error('Failed to load settings:', err)); 
  }, []);

  const showMsg = (t: string, m: string) => { 
    setToast({ type: t, message: m }); 
    setTimeout(() => setToast(null), 4000); 
  };

  async function handleSave() { 
    try {
      await fetch('/api/settings', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(settings) 
      }); 
      showMsg('success', 'Preferences saved successfully'); 
    } catch (err) {
      showMsg('error', 'Failed to save settings');
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Configure automated defaults and distribution channel preferences</p>
      </div>

      <div className="card" style={{ maxWidth: '640px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '24px' }}>Default Publishing Preferences</h3>
        
        <div className="form-group">
          <label className="form-label" htmlFor="defaultTitle">Default Title Pattern</label>
          <input 
            id="defaultTitle"
            className="form-input" 
            value={settings.defaultTitle} 
            onChange={e => setSettings({ ...settings, defaultTitle: e.target.value })} 
            placeholder="Leave empty to inherit source filename" 
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="defaultDesc">Default Description</label>
          <textarea 
            id="defaultDesc"
            className="form-textarea" 
            value={settings.defaultDescription} 
            onChange={e => setSettings({ ...settings, defaultDescription: e.target.value })} 
            placeholder="Standard description boilerplate" 
            rows={3} 
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="defaultHashtags">Default Hashtags</label>
          <input 
            id="defaultHashtags"
            className="form-input font-mono" 
            value={settings.defaultHashtags} 
            onChange={e => setSettings({ ...settings, defaultHashtags: e.target.value })} 
            placeholder="#shorts #reels" 
          />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Appended automatically to generated upload payloads
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Active Default Platforms</label>
          <div className="platform-select">
            <button 
              type="button"
              className={`platform-option youtube ${settings.defaultPlatforms.includes('youtube') ? 'selected' : ''}`} 
              onClick={() => setSettings({ 
                ...settings, 
                defaultPlatforms: settings.defaultPlatforms.includes('youtube') 
                  ? settings.defaultPlatforms.filter(p => p !== 'youtube') 
                  : [...settings.defaultPlatforms, 'youtube'] 
              })}
            >
              <div className="platform-icon" style={{ color: 'var(--youtube-red)' }} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div className="platform-name">YouTube</div>
            </button>

            <button 
              type="button"
              className={`platform-option instagram ${settings.defaultPlatforms.includes('instagram') ? 'selected' : ''}`} 
              onClick={() => setSettings({ 
                ...settings, 
                defaultPlatforms: settings.defaultPlatforms.includes('instagram') 
                  ? settings.defaultPlatforms.filter(p => p !== 'instagram') 
                  : [...settings.defaultPlatforms, 'instagram'] 
              })}
            >
              <div className="platform-icon" style={{ color: 'var(--instagram-pink)' }} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <div className="platform-name">Instagram</div>
            </button>
          </div>
        </div>

        <hr className="section-divider" />
        
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span>Save Preferences</span>
        </button>
      </div>

      {toast && (
        <div className="toast-container" role="alert">
          <div className={`toast ${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </>
  );
}
