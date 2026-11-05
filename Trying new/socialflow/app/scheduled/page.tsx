'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ScheduledPost {
  id: string;
  title?: string;
  fileName: string;
  platforms: string[];
  scheduledAt: string;
  hashtags?: string;
  status: string;
}

export default function ScheduledPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchPosts(); 
  }, []);

  async function fetchPosts() {
    try { 
      const res = await fetch('/api/posts'); 
      const data: ScheduledPost[] = await res.json();
      setPosts(
        data
          .filter((p) => p.status === 'scheduled')
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      );
    } catch (err) {
      console.error('Failed to retrieve scheduled posts:', err);
    } finally { 
      setLoading(false); 
    }
  }

  async function handleDelete(id: string) { 
    if (!confirm('Remove this scheduled post from queue?')) return; 
    await fetch(`/api/posts?id=${id}`, { method: 'DELETE' }); 
    fetchPosts(); 
  }

  async function handlePostNow(id: string) { 
    await fetch('/api/posts', { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ id, scheduledAt: new Date().toISOString() }) 
    }); 
    fetchPosts(); 
  }

  function formatDate(d: string) { 
    const date = new Date(d); 
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }); 
  }

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2>Scheduled Posts</h2>
            <p>{posts.length} video{posts.length !== 1 ? 's' : ''} queued for automatic release</p>
          </div>
          <Link href="/upload" className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Schedule New</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ animation: 'pulse 1.5s infinite' }} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3>Loading release queue...</h3>
        </div>
      ) : posts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3>No pending releases</h3>
            <p style={{ marginBottom: '16px' }}>Upload video payloads to populate the schedule</p>
            <Link href="/upload" className="btn btn-primary">Upload Video</Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          {posts.map((post) => (
            <div key={post.id} className="card" style={{ padding: '20px' }}>
              <div className="flex items-center justify-between">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-12 mb-8">
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{post.title || post.fileName}</h3>
                    <div className="flex gap-8">
                      {post.platforms.includes('youtube') && (
                        <span className="platform-badge youtube">
                          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          <span>YouTube</span>
                        </span>
                      )}
                      {post.platforms.includes('instagram') && (
                        <span className="platform-badge instagram">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </svg>
                          <span>Instagram</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <polyline points="13 2 13 9 20 9" />
                    </svg>
                    <span>{post.fileName}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--status-amber)', display: 'flex', alignItems: 'center', gap: '6px' }} className="font-mono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{formatDate(post.scheduledAt)}</span>
                  </div>
                  {post.hashtags && (
                    <div style={{ fontSize: '12px', color: 'var(--accent-blue)', marginTop: '6px' }} className="font-mono">
                      {post.hashtags}
                    </div>
                  )}
                </div>
                <div className="flex gap-8">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => handlePostNow(post.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    <span>Post Now</span>
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(post.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
