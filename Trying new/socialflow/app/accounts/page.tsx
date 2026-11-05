'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface AccountState {
  youtube?: {
    connected?: boolean;
    channelName?: string;
  };
  instagram?: {
    connected?: boolean;
    username?: string;
  };
}

function AccountsContent() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<AccountState>({ youtube: {}, instagram: {} });
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [showYTSetup, setShowYTSetup] = useState(false);
  const [ytClientId, setYtClientId] = useState('');
  const [ytClientSecret, setYtClientSecret] = useState('');
  const [showIGSetup, setShowIGSetup] = useState(false);
  const [igAppId, setIgAppId] = useState('');
  const [igAppSecret, setIgAppSecret] = useState('');

  useEffect(() => { 
    fetchAccounts(); 
    const s = searchParams.get('success'), e = searchParams.get('error');
    if (s === 'youtube') showMsg('success', 'YouTube connected successfully'); 
    if (s === 'instagram') showMsg('success', 'Instagram connected successfully');
    if (e === 'denied') showMsg('error', 'OAuth authorization was denied'); 
    if (e === 'no_ig_business') showMsg('error', 'No Instagram Business account linked to Facebook profile.');
    if (e && !['denied','no_ig_business'].includes(e)) showMsg('error', `Authentication error: ${e}`); 
  }, [searchParams]);

  async function fetchAccounts() { 
    try {
      const r = await fetch('/api/accounts'); 
      if (r.ok) setAccounts(await r.json()); 
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  }
  
  const showMsg = (t: string, m: string) => { 
    setToast({ type: t, message: m }); 
    setTimeout(() => setToast(null), 5000); 
  };

  async function connectYouTube() {
    if (!ytClientId.trim() || !ytClientSecret.trim()) { 
      showMsg('error', 'Enter both Google Client ID and Secret'); 
      return; 
    }
    await fetch('/api/accounts', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ platform: 'youtube', clientId: ytClientId.trim(), clientSecret: ytClientSecret.trim() }) 
    });
    window.location.href = '/api/auth/youtube';
  }

  async function connectInstagram() {
    if (!igAppId.trim() || !igAppSecret.trim()) { 
      showMsg('error', 'Enter both Meta App ID and Secret'); 
      return; 
    }
    await fetch('/api/accounts', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ platform: 'instagram', appId: igAppId.trim(), appSecret: igAppSecret.trim() }) 
    });
    window.location.href = '/api/auth/instagram';
  }

  async function disconnect(platform: string) {
    if (!confirm(`Disconnect ${platform} integration?`)) return;
    await fetch('/api/accounts', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        platform, 
        ...(platform === 'youtube' 
          ? { clientId: '', clientSecret: '', refreshToken: '' } 
          : { accessToken: '', userId: '', appId: '', appSecret: '' }) 
      }) 
    });
    fetchAccounts(); 
    showMsg('info', `${platform} disconnected`);
  }

  return (
    <>
      <div className="page-header">
        <h2>Connected Accounts</h2>
        <p>Manage OAuth credentials and publishing authorizations for YouTube and Instagram</p>
      </div>

      <div className="card" style={{ marginBottom: '24px', background: 'var(--bg-secondary)', borderLeft: '3px solid var(--accent-blue)' }}>
        <div style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>OAuth Configuration Note:</strong> Create developer credentials once on Google Cloud and Meta for Developers. Ensure your browser accesses this dashboard at <code className="font-mono" style={{ color: 'var(--accent-blue)' }}>http://127.0.0.1:3000</code> rather than localhost to satisfy callback URI constraints.
        </div>
      </div>

      <div className="flex flex-col gap-20">
        {/* YouTube Card */}
        <div className="card">
          <div className="account-card" style={{ padding: 0, marginBottom: showYTSetup ? '20px' : 0 }}>
            <div className="account-icon youtube" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div className="account-info">
              <div className="account-name">YouTube</div>
              <div className="account-status">
                <span className={`status-dot ${accounts.youtube?.connected ? 'connected' : 'disconnected'}`}></span>
                {accounts.youtube?.connected ? `Connected${accounts.youtube?.channelName ? ` — ${accounts.youtube.channelName}` : ''}` : 'Not connected'}
              </div>
            </div>
            {accounts.youtube?.connected ? (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => disconnect('youtube')} aria-label="Disconnect YouTube">
                Disconnect
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowYTSetup(!showYTSetup)} aria-expanded={showYTSetup}>
                {showYTSetup ? 'Cancel' : 'Connect Account'}
              </button>
            )}
          </div>

          {showYTSetup && !accounts.youtube?.connected && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Google Cloud Platform Setup</h4>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '16px', fontSize: '13px', lineHeight: '1.9', marginBottom: '20px', border: '1px solid var(--border)' }}>
                <div><strong>Step 1:</strong> Access <a href="https://console.cloud.google.com/apis/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>Google Cloud Console</a> and create or select a project.</div>
                <div><strong>Step 2:</strong> Under <strong>APIs &amp; Services &gt; Library</strong>, search for <strong>YouTube Data API v3</strong> and enable it.</div>
                <div><strong>Step 3:</strong> In <strong>OAuth consent screen</strong>, select External and configure your test email account.</div>
                <div><strong>Step 4:</strong> In <strong>Credentials</strong>, select <strong>Create Credentials &gt; OAuth Client ID</strong> with application type <strong>Desktop app</strong>.</div>
                <div><strong>Step 5:</strong> Copy the generated Client ID and Client Secret into the inputs below:</div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ytClientId">Client ID</label>
                <input id="ytClientId" className="form-input font-mono" value={ytClientId} onChange={e => setYtClientId(e.target.value)} placeholder="apps.googleusercontent.com Client ID" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ytClientSecret">Client Secret</label>
                <input id="ytClientSecret" className="form-input font-mono" type="password" value={ytClientSecret} onChange={e => setYtClientSecret(e.target.value)} placeholder="Google Client Secret" />
              </div>
              <button type="button" className="btn btn-primary" onClick={connectYouTube} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Authorize YouTube with Google</span>
              </button>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                You will be redirected to Google to grant video upload permissions
              </div>
            </div>
          )}
        </div>

        {/* Instagram Card */}
        <div className="card">
          <div className="account-card" style={{ padding: 0, marginBottom: showIGSetup ? '20px' : 0 }}>
            <div className="account-icon instagram" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </div>
            <div className="account-info">
              <div className="account-name">Instagram</div>
              <div className="account-status">
                <span className={`status-dot ${accounts.instagram?.connected ? 'connected' : 'disconnected'}`}></span>
                {accounts.instagram?.connected ? `Connected${accounts.instagram?.username ? ` — @${accounts.instagram.username}` : ''}` : 'Not connected'}
              </div>
            </div>
            {accounts.instagram?.connected ? (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => disconnect('instagram')} aria-label="Disconnect Instagram">
                Disconnect
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowIGSetup(!showIGSetup)} aria-expanded={showIGSetup}>
                {showIGSetup ? 'Cancel' : 'Connect Account'}
              </button>
            )}
          </div>

          {showIGSetup && !accounts.instagram?.connected && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Meta Graph API Setup</h4>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '16px', fontSize: '13px', lineHeight: '1.9', marginBottom: '20px', border: '1px solid var(--border)' }}>
                <div><strong>Requirement:</strong> Target Instagram account must be a <strong>Business or Creator</strong> account linked to a Facebook Page.</div>
                <div><strong>Step 1:</strong> Visit <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>Meta for Developers</a> and create an app with <strong>Business</strong> type.</div>
                <div><strong>Step 2:</strong> Add the <strong>Instagram Graph API</strong> product to your app.</div>
                <div><strong>Step 3:</strong> In <strong>Settings &gt; Basic</strong>, copy your App ID and App Secret.</div>
                <div><strong>Step 4:</strong> Under <strong>Facebook Login &gt; Settings</strong>, add the redirect URI: <code className="font-mono" style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>http://127.0.0.1:3000/api/auth/instagram/callback</code></div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="igAppId">App ID</label>
                <input id="igAppId" className="form-input font-mono" value={igAppId} onChange={e => setIgAppId(e.target.value)} placeholder="Meta App ID" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="igAppSecret">App Secret</label>
                <input id="igAppSecret" className="form-input font-mono" type="password" value={igAppSecret} onChange={e => setIgAppSecret(e.target.value)} placeholder="Meta App Secret" />
              </div>
              <button type="button" className="btn btn-primary" onClick={connectInstagram} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Authorize Instagram with Meta</span>
              </button>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                Sign in with Facebook to grant publishing access to your linked Instagram Business profile
              </div>
            </div>
          )}
        </div>
      </div>
      {toast && (
        <div className="toast-container" role="alert">
          <div className={`toast ${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={
      <div className="page-header">
        <h2>Connected Accounts</h2>
        <p>Loading accounts configuration...</p>
      </div>
    }>
      <AccountsContent />
    </Suspense>
  );
}
