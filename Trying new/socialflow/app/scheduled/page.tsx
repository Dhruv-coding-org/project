'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ScheduledPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchPosts(); }, []);
  async function fetchPosts() {
    try { const res = await fetch('/api/posts'); const data = await res.json();
      setPosts(data.filter((p: any) => p.status === 'scheduled').sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
    } catch (err) {} finally { setLoading(false); }
  }
  async function handleDelete(id: string) { if (!confirm('Delete this scheduled post?')) return; await fetch(`/api/posts?id=${id}`, { method: 'DELETE' }); fetchPosts(); }
  async function handlePostNow(id: string) { await fetch('/api/posts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, scheduledAt: new Date().toISOString() }) }); fetchPosts(); }
  function formatDate(d: string) { const date = new Date(d); return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

  return (
    <>
      <div className="page-header"><div className="flex items-center justify-between"><div><h2>Scheduled Posts</h2><p>{posts.length} video{posts.length !== 1 ? 's' : ''} waiting to be posted</p></div><Link href="/upload" className="btn btn-primary"><span>📤</span> Schedule New</Link></div></div>
      {loading ? <div className="empty-state"><div style={{ fontSize: '32px', animation: 'pulse 1.5s infinite' }}>⏳</div><h3>Loading...</h3></div>
      : posts.length === 0 ? <div className="card"><div className="empty-state"><div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div><h3>No scheduled posts</h3><p style={{ marginBottom: '16px' }}>Upload a video to get started</p><Link href="/upload" className="btn btn-primary">Upload Video</Link></div></div>
      : <div className="flex flex-col gap-16">{posts.map((post) => (
          <div key={post.id} className="card" style={{ padding: '20px' }}><div className="flex items-center justify-between"><div style={{ flex: 1 }}>
            <div className="flex items-center gap-12 mb-8"><h3 style={{ fontSize: '16px', fontWeight: 600 }}>{post.title}</h3><div className="flex gap-8">{post.platforms.includes('youtube') && <span className="platform-badge youtube">▶️ YouTube</span>}{post.platforms.includes('instagram') && <span className="platform-badge instagram">📸 Instagram</span>}</div></div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>📁 {post.fileName}</div>
            <div style={{ fontSize: '13px', color: 'var(--accent-orange)' }}>🕐 {formatDate(post.scheduledAt)}</div>
            {post.hashtags && <div style={{ fontSize: '12px', color: 'var(--accent-blue)', marginTop: '6px' }}>{post.hashtags}</div>}
          </div><div className="flex gap-8"><button className="btn btn-primary btn-sm" onClick={() => handlePostNow(post.id)}>🚀 Post Now</button><button className="btn btn-danger btn-sm" onClick={() => handleDelete(post.id)}>🗑️ Delete</button></div></div></div>
        ))}</div>}
    </>
  );
}
