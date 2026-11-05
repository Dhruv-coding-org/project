'use client';
import { useState, useEffect } from 'react';

interface HistoryPost {
  id: string;
  title?: string;
  fileName: string;
  platforms: string[];
  scheduledAt: string;
  postedAt?: string;
  status: 'all' | 'posted' | 'scheduled' | 'failed';
  error?: string;
}

export default function HistoryPage() {
  const [posts, setPosts] = useState<HistoryPost[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { 
    fetch('/api/posts')
      .then(r => r.json())
      .then(d => setPosts(d.reverse()))
      .catch((err) => console.error('Failed to load history:', err)); 
  }, []);

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter);

  function getStatusColor(s: string) { 
    switch (s) {
      case 'scheduled': return 'var(--status-amber)';
      case 'uploading': return 'var(--accent-blue)';
      case 'posted': return 'var(--status-green)';
      case 'failed': return 'var(--status-red)';
      default: return 'var(--text-muted)';
    }
  }

  function formatDate(d: string) { 
    return new Date(d).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }); 
  }

  return (
    <>
      <div className="page-header">
        <h2>Post History</h2>
        <p>Complete historical log of scheduled, completed, and failed dispatches</p>
      </div>

      <div className="tabs" style={{ width: 'fit-content', marginBottom: '24px' }}>
        {['all', 'posted', 'scheduled', 'failed'].map((f) => (
          <button 
            key={f} 
            type="button"
            className={`tab ${filter === f ? 'active' : ''}`} 
            onClick={() => setFilter(f)} 
            style={{ textTransform: 'capitalize' }}
          >
            {f} {f !== 'all' && `(${posts.filter(p => p.status === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3>No entries found</h3>
            <p>Historical publish attempts matching this filter will show here</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Source File</th>
                <th>Platforms</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id}>
                  <td style={{ fontWeight: 500 }}>{post.title || post.fileName}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{post.fileName}</td>
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
                    {formatDate(post.postedAt || post.scheduledAt)}
                  </td>
                  <td>
                    <span style={{ color: getStatusColor(post.status), fontWeight: 600, fontSize: '13px', textTransform: 'capitalize' }}>
                      {post.status}
                    </span>
                    {post.error && (
                      <div style={{ fontSize: '11px', color: 'var(--status-red)', marginTop: '2px' }} className="font-mono">
                        {post.error}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
