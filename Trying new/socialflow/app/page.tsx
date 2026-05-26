'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalPosts: 0, scheduledPosts: 0, postedPosts: 0, failedPosts: 0 });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState({ youtube: false, instagram: false });

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 10000); return () => clearInterval(i); }, []);

  async function fetchData() {
    try {
      const [postsRes, accountsRes] = await Promise.all([fetch('/api/posts'), fetch('/api/accounts')]);
      const posts = await postsRes.json();
      const accs = await accountsRes.json();
      setStats({ totalPosts: posts.length, scheduledPosts: posts.filter((p: any) => p.status === 'scheduled').length,
        postedPosts: posts.filter((p: any) => p.status === 'posted').length, failedPosts: posts.filter((p: any) => p.status === 'failed').length });
      setRecentPosts(posts.slice(-5).reverse());
      setAccounts({ youtube: accs.youtube?.connected || false, instagram: accs.instagram?.connected || false });
    } catch (err) {}
  }

  function formatDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  function getStatusColor(s: string) { return ({ scheduled: 'var(--accent-orange)', uploading: 'var(--accent-blue)', posted: 'var(--accent-green)', failed: 'var(--accent-red)' } as any)[s] || 'var(--text-muted)'; }

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div><h2>Dashboard</h2><p>Your social media automation at a glance</p></div>
          <Link href="/upload" className="btn btn-primary"><span>📤</span> Upload Video</Link>
        </div>
      </div>
      <div className="stats-grid">
        <div className="card stat-card"><div className="stat-icon purple">📊</div><div className="stat-value">{stats.totalPosts}</div><div className="stat-label">Total Posts</div></div>
        <div className="card stat-card"><div className="stat-icon blue">📅</div><div className="stat-value">{stats.scheduledPosts}</div><div className="stat-label">Scheduled</div></div>
        <div className="card stat-card"><div className="stat-icon green">✅</div><div className="stat-value">{stats.postedPosts}</div><div className="stat-label">Posted</div></div>
        <div className="card stat-card"><div className="stat-icon pink">⚠️</div><div className="stat-value">{stats.failedPosts}</div><div className="stat-label">Failed</div></div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="flex items-center justify-between mb-16"><h3 style={{ fontSize: '16px', fontWeight: 600 }}>Connected Accounts</h3><Link href="/accounts" className="btn btn-secondary btn-sm">Manage</Link></div>
          <div className="flex flex-col gap-12">
            <div className="flex items-center gap-12" style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ fontSize: '24px' }}>▶️</div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '14px' }}>YouTube</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><span className={`status-dot ${accounts.youtube ? 'connected' : 'disconnected'}`}></span>{accounts.youtube ? 'Connected' : 'Not Connected'}</div></div>
            </div>
            <div className="flex items-center gap-12" style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ fontSize: '24px' }}>📸</div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '14px' }}>Instagram</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><span className={`status-dot ${accounts.instagram ? 'connected' : 'disconnected'}`}></span>{accounts.instagram ? 'Connected' : 'Not Connected'}</div></div>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Quick Actions</h3>
          <div className="flex flex-col gap-8">
            <Link href="/upload" className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>📤 Upload & Schedule Video</Link>
            <Link href="/scheduled" className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>📅 View Scheduled Posts</Link>
            <Link href="/accounts" className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>🔗 Connect Social Accounts</Link>
            <Link href="/settings" className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>⚙️ Configure Defaults</Link>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="flex items-center justify-between mb-16"><h3 style={{ fontSize: '16px', fontWeight: 600 }}>Recent Posts</h3><Link href="/history" className="btn btn-secondary btn-sm">View All</Link></div>
        {recentPosts.length === 0 ? (
          <div className="empty-state"><div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div><h3>No posts yet</h3><p>Upload your first video to get started</p></div>
        ) : (
          <div className="table-container"><table><thead><tr><th>Title</th><th>Platforms</th><th>Scheduled</th><th>Status</th></tr></thead><tbody>
            {recentPosts.map((post) => (<tr key={post.id}><td style={{ fontWeight: 500 }}>{post.title || post.fileName}</td><td><div className="flex gap-8">{post.platforms.includes('youtube') && <span className="platform-badge youtube">▶️ YT</span>}{post.platforms.includes('instagram') && <span className="platform-badge instagram">📸 IG</span>}</div></td><td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{formatDate(post.scheduledAt)}</td><td><span style={{ color: getStatusColor(post.status), fontWeight: 600, fontSize: '13px', textTransform: 'capitalize' }}>{post.status}</span></td></tr>))}
          </tbody></table></div>
        )}
      </div>
    </>
  );
}
