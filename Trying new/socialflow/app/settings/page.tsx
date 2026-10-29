'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({ defaultTitle: '', defaultDescription: '', defaultHashtags: '#shorts #reels #viral #trending', defaultPlatforms: ['youtube', 'instagram'] });
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  useEffect(() => { fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {}); }, []);
  const showMsg = (t: string, m: string) => { setToast({ type: t, message: m }); setTimeout(() => setToast(null), 4000); };
  async function handleSave() { await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); showMsg('success', 'Settings saved!'); }
  return (
    <>
      <div className="page-header"><h2>Settings</h2><p>Configure your default posting preferences</p></div>
      <div className="card" style={{ maxWidth: '640px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Default Post Settings</h3>
        <div className="form-group"><label className="form-label">Default Title</label><input className="form-input" value={settings.defaultTitle} onChange={e => setSettings({ ...settings, defaultTitle: e.target.value })} placeholder="Leave empty to use filename" /></div>
        <div className="form-group"><label className="form-label">Default Description</label><textarea className="form-textarea" value={settings.defaultDescription} onChange={e => setSettings({ ...settings, defaultDescription: e.target.value })} placeholder="Default description" rows={3} /></div>
        <div className="form-group"><label className="form-label">Default Hashtags</label><input className="form-input" value={settings.defaultHashtags} onChange={e => setSettings({ ...settings, defaultHashtags: e.target.value })} placeholder="#shorts #reels" /><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Pre-filled when uploading</div></div>
        <div className="form-group"><label className="form-label">Default Platforms</label>
          <div className="platform-select">
            <button className={`platform-option youtube ${settings.defaultPlatforms.includes('youtube') ? 'selected' : ''}`} onClick={() => setSettings({ ...settings, defaultPlatforms: settings.defaultPlatforms.includes('youtube') ? settings.defaultPlatforms.filter(p => p !== 'youtube') : [...settings.defaultPlatforms, 'youtube'] })}><div style={{ fontSize: '24px' }}>▶️</div><div className="platform-name">YouTube</div></button>
            <button className={`platform-option instagram ${settings.defaultPlatforms.includes('instagram') ? 'selected' : ''}`} onClick={() => setSettings({ ...settings, defaultPlatforms: settings.defaultPlatforms.includes('instagram') ? settings.defaultPlatforms.filter(p => p !== 'instagram') : [...settings.defaultPlatforms, 'instagram'] })}><div style={{ fontSize: '24px' }}>📸</div><div className="platform-name">Instagram</div></button>
          </div>
        </div>
        <hr className="section-divider" />
        <button className="btn btn-primary" onClick={handleSave}>💾 Save Settings</button>
      </div>
      {toast && <div className="toast-container"><div className={`toast ${toast.type}`}>{toast.message}</div></div>}
    </>
  );
}
