'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AccountsPage() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<any>({ youtube: {}, instagram: {} });
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [showYTSetup, setShowYTSetup] = useState(false);
  const [ytClientId, setYtClientId] = useState('');
  const [ytClientSecret, setYtClientSecret] = useState('');
  const [showIGSetup, setShowIGSetup] = useState(false);
  const [igAppId, setIgAppId] = useState('');
  const [igAppSecret, setIgAppSecret] = useState('');

  useEffect(() => { fetchAccounts(); const s = searchParams.get('success'), e = searchParams.get('error');
    if (s === 'youtube') showMsg('success', '✅ YouTube connected!'); if (s === 'instagram') showMsg('success', '✅ Instagram connected!');
    if (e === 'denied') showMsg('error', 'Authorization denied'); if (e === 'no_ig_business') showMsg('error', 'No Instagram Business account found.');
    if (e && !['denied','no_ig_business'].includes(e)) showMsg('error', `Error: ${e}`); }, [searchParams]);

  async function fetchAccounts() { const r = await fetch('/api/accounts'); setAccounts(await r.json()); }
  const showMsg = (t: string, m: string) => { setToast({ type: t, message: m }); setTimeout(() => setToast(null), 5000); };

  async function connectYouTube() {
    if (!ytClientId.trim() || !ytClientSecret.trim()) { showMsg('error', 'Enter both Client ID and Secret'); return; }
    await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'youtube', clientId: ytClientId.trim(), clientSecret: ytClientSecret.trim() }) });
    window.location.href = '/api/auth/youtube';
  }
  async function connectInstagram() {
    if (!igAppId.trim() || !igAppSecret.trim()) { showMsg('error', 'Enter both App ID and Secret'); return; }
    await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'instagram', appId: igAppId.trim(), appSecret: igAppSecret.trim() }) });
    window.location.href = '/api/auth/instagram';
  }
  async function disconnect(platform: string) {
    if (!confirm(`Disconnect ${platform}?`)) return;
    await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, ...(platform === 'youtube' ? { clientId: '', clientSecret: '', refreshToken: '' } : { accessToken: '', userId: '', appId: '', appSecret: '' }) }) });
    fetchAccounts(); showMsg('info', `${platform} disconnected`);
  }

  return (
    <>
      <div className="page-header"><h2>Connected Accounts</h2><p>Link your YouTube and Instagram to start auto-uploading</p></div>
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))', borderColor: 'rgba(99,102,241,0.2)' }}>
        <div style={{ fontSize: '14px', lineHeight: '1.7' }}><strong>💡 How this works:</strong> Create an app on Google/Meta <em>(one-time, ~5 min)</em>, paste 2 values, click Connect, sign in. Done!<br /><br /><strong>⚠️ Important:</strong> Open at <a href="http://127.0.0.1:3000" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>http://127.0.0.1:3000</a> (not localhost) for OAuth.</div>
      </div>
      <div className="flex flex-col gap-20">
        <div className="card">
          <div className="account-card" style={{ padding: 0, marginBottom: showYTSetup ? '20px' : 0 }}>
            <div className="account-icon youtube">▶️</div>
            <div className="account-info"><div className="account-name">YouTube</div><div className="account-status"><span className={`status-dot ${accounts.youtube?.connected ? 'connected' : 'disconnected'}`}></span>{accounts.youtube?.connected ? `Connected${accounts.youtube?.channelName ? ` — ${accounts.youtube.channelName}` : ''}` : 'Not connected'}</div></div>
            {accounts.youtube?.connected ? <button className="btn btn-danger btn-sm" onClick={() => disconnect('youtube')}>Disconnect</button> : <button className="btn btn-primary btn-sm" onClick={() => setShowYTSetup(!showYTSetup)}>{showYTSetup ? 'Cancel' : '🔗 Connect'}</button>}
          </div>
          {showYTSetup && !accounts.youtube?.connected && <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>📋 One-time setup (~5 min)</h4>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '16px', fontSize: '13px', lineHeight: '2', marginBottom: '24px' }}>
              <div><strong>Step 1:</strong> Go to <a href="https://console.cloud.google.com/apis/dashboard" target="_blank" rel="noopener" style={{ color: 'var(--accent-blue)' }}>Google Cloud Console</a> → Create a new project</div>
              <div><strong>Step 2:</strong> Go to <strong>APIs &amp; Services → Library</strong> → Search &quot;YouTube Data API v3&quot; → <strong>Enable</strong></div>
              <div><strong>Step 3:</strong> Go to <strong>APIs &amp; Services → OAuth consent screen</strong> → Choose <strong>External</strong> → Fill in app name &amp; email → Save → Add yourself as test user</div>
              <div><strong>Step 4:</strong> Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" style={{ color: 'var(--accent-blue)' }}>Credentials</a> → <strong>Create Credentials → OAuth Client ID</strong></div>
              <div><strong>Step 5:</strong> Set type to <strong>Desktop app</strong> (NOT Web application!) → Create</div>
              <div><strong>Step 6:</strong> Copy <strong>Client ID</strong> and <strong>Client Secret</strong> below 👇</div>
            </div>
            <div className="form-group"><label className="form-label">Client ID</label><input className="form-input" value={ytClientId} onChange={e => setYtClientId(e.target.value)} placeholder="Google OAuth Client ID" /></div>
            <div className="form-group"><label className="form-label">Client Secret</label><input className="form-input" type="password" value={ytClientSecret} onChange={e => setYtClientSecret(e.target.value)} placeholder="Google OAuth Client Secret" /></div>
            <button className="btn btn-primary" onClick={connectYouTube} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>🔐 Connect YouTube — Sign in with Google</button>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>You&apos;ll be redirected to Google to authorize</div>
          </div>}
        </div>
        <div className="card">
          <div className="account-card" style={{ padding: 0, marginBottom: showIGSetup ? '20px' : 0 }}>
            <div className="account-icon instagram">📸</div>
            <div className="account-info"><div className="account-name">Instagram</div><div className="account-status"><span className={`status-dot ${accounts.instagram?.connected ? 'connected' : 'disconnected'}`}></span>{accounts.instagram?.connected ? `Connected${accounts.instagram?.username ? ` — @${accounts.instagram.username}` : ''}` : 'Not connected'}</div></div>
            {accounts.instagram?.connected ? <button className="btn btn-danger btn-sm" onClick={() => disconnect('instagram')}>Disconnect</button> : <button className="btn btn-primary btn-sm" onClick={() => setShowIGSetup(!showIGSetup)}>{showIGSetup ? 'Cancel' : '🔗 Connect'}</button>}
          </div>
          {showIGSetup && !accounts.instagram?.connected && <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>📋 One-time setup (~5 min)</h4>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '16px', fontSize: '13px', lineHeight: '2', marginBottom: '24px' }}>
              <div><strong>Requirement:</strong> Instagram must be <strong>Business/Creator</strong> account linked to a Facebook Page</div>
              <div><strong>Step 1:</strong> Go to <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener" style={{ color: 'var(--accent-pink)' }}>Meta for Developers</a> → Create App → Select <strong>Business</strong></div>
              <div><strong>Step 2:</strong> Add <strong>Instagram Graph API</strong> product</div>
              <div><strong>Step 3:</strong> Go to <strong>Settings → Basic</strong> → Copy <strong>App ID</strong> and <strong>App Secret</strong></div>
              <div><strong>Step 4:</strong> In <strong>Facebook Login → Settings</strong>, add redirect URI: <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>http://127.0.0.1:3000/api/auth/instagram/callback</code></div>
              <div><strong>Step 5:</strong> Paste values below 👇</div>
            </div>
            <div className="form-group"><label className="form-label">App ID</label><input className="form-input" value={igAppId} onChange={e => setIgAppId(e.target.value)} placeholder="Meta App ID" /></div>
            <div className="form-group"><label className="form-label">App Secret</label><input className="form-input" type="password" value={igAppSecret} onChange={e => setIgAppSecret(e.target.value)} placeholder="Meta App Secret" /></div>
            <button className="btn btn-primary" onClick={connectInstagram} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>🔐 Connect Instagram — Sign in with Facebook</button>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>Sign in with Facebook to grant access to your IG Business account</div>
          </div>}
        </div>
      </div>
      {toast && <div className="toast-container"><div className={`toast ${toast.type}`}>{toast.message}</div></div>}
    </>
  );
}
