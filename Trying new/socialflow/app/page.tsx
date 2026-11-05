'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PostRecord {
  id: string;
  title?: string;
  fileName: string;
  platforms: string[];
  scheduledAt: string;
  status: 'scheduled' | 'uploading' | 'posted' | 'failed';
  error?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ totalPosts: 0, scheduledPosts: 0, postedPosts: 0, failedPosts: 0 });
  const [recentPosts, setRecentPosts] = useState<PostRecord[]>([]);
  const [accounts, setAccounts] = useState({ youtube: false, instagram: false });

  useEffect(() => { 
    fetchData(); 
    const i = setInterval(fetchData, 10000); 
    return () => clearInterval(i); 
  }, []);

  async function fetchData() {
    try {
      const [postsRes, accountsRes] = await Promise.all([fetch('/api/posts'), fetch('/api/accounts')]);
      const posts: PostRecord[] = await postsRes.json();
      const accs = await accountsRes.json();
      setStats({
        totalPosts: posts.length,
        scheduledPosts: posts.filter((p) => p.status === 'scheduled').length,
        postedPosts: posts.filter((p) => p.status === 'posted').length,
        failedPosts: posts.filter((p) => p.status === 'failed').length
      });
      setRecentPosts(posts.slice(-5).reverse());
      setAccounts({ 
        youtube: accs.youtube?.connected || false, 
        instagram: accs.instagram?.connected || false 
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }

  function formatDate(d: string) { 
    return new Date(d).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }); 
  }

  function getStatusColor(s: string) { 
    switch (s) {
      case 'scheduled': return 'var(--status-amber)';
      case 'uploading': return 'var(--accent-blue)';
      case 'posted': return 'var(--status-green)';
      case 'failed': return 'var(--status-red)';
      default: return 'var(--text-muted)';
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2>Dashboard</h2>
            <p>Your social media publishing pipeline at a glance</p>
          </div>
          <Link href="/upload" className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Upload Video</span>
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon blue" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div className="stat-value">{stats.totalPosts}</div>
          <div className="stat-label">Total Posts</div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon amber" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="stat-value">{stats.scheduledPosts}</div>
          <div className="stat-label">Scheduled</div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon green" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-value">{stats.postedPosts}</div>
          <div className="stat-label">Published</div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon red" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="stat-value">{stats.failedPosts}</div>
          <div className="stat-label">Failed</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="flex items-center justify-between mb-16">
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Connected Accounts</h3>
            <Link href="/accounts" className="btn btn-secondary btn-sm">Manage</Link>
          </div>
          <div className="flex flex-col gap-12">
            <div className="flex items-center gap-12" style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--youtube-red)' }} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>YouTube</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span className={`status-dot ${accounts.youtube ? 'connected' : 'disconnected'}`}></span>
                  {accounts.youtube ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-12" style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--instagram-pink)' }} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Instagram</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span className={`status-dot ${accounts.instagram ? 'connected' : 'disconnected'}`}></span>
                  {accounts.instagram ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Quick Actions</h3>
          <div className="flex flex-col gap-8">
            <Link href="/upload" className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Upload &amp; Schedule Video</span>
            </Link>
            <Link href="/scheduled" className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>View Scheduled Queue</span>
            </Link>
            <Link href="/accounts" className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>Manage Social Credentials</span>
            </Link>
            <Link href="/settings" className="btn btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Configure Default Tags &amp; Copy</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="flex items-center justify-between mb-16">
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Recent Posts</h3>
          <Link href="/history" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        {recentPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>No posts recorded</h3>
            <p>Upload your first video to initiate publishing</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Platforms</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPosts.map((post) => (
                  <tr key={post.id}>
                    <td style={{ fontWeight: 500 }}>{post.title || post.fileName}</td>
                    <td>
                      <div className="flex gap-8">
                        {post.platforms.includes('youtube') && (
                          <span className="platform-badge youtube">
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            <span>YT</span>
                          </span>
                        )}
                        {post.platforms.includes('instagram') && (
                          <span className="platform-badge instagram">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                            </svg>
                            <span>IG</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }} className="font-mono">
                      {formatDate(post.scheduledAt)}
                    </td>
                    <td>
                      <span style={{ color: getStatusColor(post.status), fontWeight: 600, fontSize: '13px', textTransform: 'capitalize' }}>
                        {post.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
