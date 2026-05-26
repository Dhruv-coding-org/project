'use client';
import { useState, useEffect } from 'react';

export default function HistoryPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  useEffect(() => { fetch('/api/posts').then(r => r.json()).then(d => setPosts(d.reverse())); }, []);
  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter);
  function getStatusColor(s: string) { return ({ scheduled: 'var(--accent-orange)', uploading: 'var(--accent-blue)', posted: 'var(--accent-green)', failed: 'var(--accent-red)' } as any)[s] || 'var(--text-muted)'; }
  function formatDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  return (
    <>
      <div className="page-header"><h2>Post History</h2><p>All your uploaded and scheduled content</p></div>
      <div className="tabs" style={{ width: 'fit-content', marginBottom: '24px' }}>
        {['all', 'posted', 'scheduled', 'failed'].map(f => <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f} {f !== 'all' && `(${posts.filter(p => p.status === f).length})`}</button>)}
      </div>
      {filtered.length === 0 ? <div className="card"><div className="empty-state"><div style={{ fontSize: '48px', marginBottom: '12px' }}>📜</div><h3>No posts found</h3><p>Your post history will appear here</p></div></div>
      : <div className="table-container"><table><thead><tr><th>Title</th><th>File</th><th>Platforms</th><th>Date</th><th>Status</th></tr></thead><tbody>
        {filtered.map(post => <tr key={post.id}><td style={{ fontWeight: 500 }}>{post.title}</td><td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{post.fileName}</td>
          <td><div className="flex gap-8">{post.platforms.includes('youtube') && <span className="platform-badge youtube">YT</span>}{post.platforms.includes('instagram') && <span className="platform-badge instagram">IG</span>}</div></td>
          <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{formatDate(post.postedAt || post.scheduledAt)}</td>
          <td><span style={{ color: getStatusColor(post.status), fontWeight: 600, fontSize: '13px', textTransform: 'capitalize' }}>{post.status}</span>{post.error && <div style={{ fontSize: '11px', color: 'var(--accent-red)', marginTop: '2px' }}>{post.error}</div>}</td></tr>)}
      </tbody></table></div>}
    </>
  );
}
