'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('#shorts #reels #viral #trending');
  const [platforms, setPlatforms] = useState<string[]>(['youtube', 'instagram']);
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const showToast = (type: string, message: string) => { 
    setToast({ type, message }); 
    setTimeout(() => setToast(null), 4000); 
  };

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('video/')) { 
      showToast('error', 'Please select a valid video file'); 
      return; 
    }
    if (f.size > 500 * 1024 * 1024) { 
      showToast('error', 'File size exceeds maximum threshold (500MB)'); 
      return; 
    }
    setFile(f); 
    setVideoPreview(URL.createObjectURL(f));
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }, [title]);

  const handleDrop = useCallback((e: React.DragEvent) => { 
    e.preventDefault(); 
    setDragOver(false); 
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); 
  }, [handleFile]);

  const togglePlatform = (p: string) => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleSubmit = async () => {
    if (!file) { showToast('error', 'Please select a video'); return; }
    if (!title.trim()) { showToast('error', 'Please enter a title'); return; }
    if (platforms.length === 0) { showToast('error', 'Select at least one destination platform'); return; }
    
    setUploading(true); 
    setUploadProgress(10);
    try {
      const formData = new FormData(); 
      formData.append('file', file); 
      setUploadProgress(30);
      
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error); 
      setUploadProgress(60);
      
      let scheduledAt = new Date().toISOString();
      if (scheduleType === 'scheduled' && scheduledDate && scheduledTime) {
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }
      
      const postRes = await fetch('/api/posts', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title.trim(), 
          description: `${description.trim()}\n\n${hashtags.trim()}`, 
          hashtags: hashtags.trim(),
          filePath: uploadData.filePath, 
          fileName: uploadData.fileName, 
          fileSize: uploadData.fileSize, 
          platforms, 
          scheduledAt 
        }) 
      });
      if (!postRes.ok) throw new Error('Failed to record queued post');
      setUploadProgress(100);
      showToast('success', scheduleType === 'now' ? 'Video queued for upload!' : 'Video scheduled successfully!');
      setTimeout(() => router.push('/scheduled'), 1500);
    } catch (err: any) { 
      showToast('error', err.message || 'Transmission failed'); 
    } finally { 
      setUploading(false); 
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Upload Video</h2>
        <p>Prepare and distribute vertical video content across YouTube Shorts &amp; Instagram Reels</p>
      </div>

      <div className="grid-2">
        <div>
          {!file ? (
            <div 
              className={`upload-zone ${dragOver ? 'dragover' : ''}`} 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} 
              onDragLeave={() => setDragOver(false)} 
              onDrop={handleDrop}
            >
              <div className="upload-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <h3>Select video file</h3>
              <p>Drag and drop or click to browse &bull; MP4, MOV, WebM &bull; Up to 500MB</p>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="video/*" 
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
                style={{ display: 'none' }} 
              />
            </div>
          ) : (
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="file-preview">
                <video src={videoPreview} controls style={{ width: '100%', maxHeight: '350px' }} />
                <button 
                  className="remove-file" 
                  onClick={() => { setFile(null); setVideoPreview(''); }}
                  aria-label="Remove video"
                >
                  &times;
                </button>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{file.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }} className="font-mono">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <label className="form-label">Destination Platforms</label>
            <div className="platform-select">
              <button 
                type="button"
                className={`platform-option youtube ${platforms.includes('youtube') ? 'selected' : ''}`} 
                onClick={() => togglePlatform('youtube')}
              >
                <div className="platform-icon" style={{ color: 'var(--youtube-red)' }} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div className="platform-name">YouTube Shorts</div>
              </button>

              <button 
                type="button"
                className={`platform-option instagram ${platforms.includes('instagram') ? 'selected' : ''}`} 
                onClick={() => togglePlatform('instagram')}
              >
                <div className="platform-icon" style={{ color: 'var(--instagram-pink)' }} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </div>
                <div className="platform-name">Instagram Reels</div>
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Post Metadata</h3>
          
          <div className="form-group">
            <label className="form-label" htmlFor="videoTitle">Title</label>
            <input 
              id="videoTitle"
              className="form-input" 
              type="text" 
              placeholder="Enter video title..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="videoDesc">Description</label>
            <textarea 
              id="videoDesc"
              className="form-textarea" 
              placeholder="Enter description and tags..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows={3} 
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="videoTags">Hashtags</label>
            <input 
              id="videoTags"
              className="form-input font-mono" 
              type="text" 
              placeholder="#shorts #reels #viral" 
              value={hashtags} 
              onChange={(e) => setHashtags(e.target.value)} 
            />
          </div>

          <hr className="section-divider" />

          <div className="form-group">
            <label className="form-label">Dispatch Timing</label>
            <div className="tabs" style={{ marginBottom: '16px' }}>
              <button 
                type="button"
                className={`tab ${scheduleType === 'now' ? 'active' : ''}`} 
                onClick={() => setScheduleType('now')}
              >
                Publish Immediately
              </button>
              <button 
                type="button"
                className={`tab ${scheduleType === 'scheduled' ? 'active' : ''}`} 
                onClick={() => setScheduleType('scheduled')}
              >
                Schedule Release
              </button>
            </div>
            {scheduleType === 'scheduled' && (
              <div className="datetime-input">
                <input 
                  className="form-input" 
                  type="date" 
                  value={scheduledDate} 
                  onChange={(e) => setScheduledDate(e.target.value)} 
                  aria-label="Release date"
                />
                <input 
                  className="form-input" 
                  type="time" 
                  value={scheduledTime} 
                  onChange={(e) => setScheduledTime(e.target.value)} 
                  aria-label="Release time"
                />
              </div>
            )}
          </div>

          {uploading && (
            <div style={{ marginBottom: '16px' }}>
              <div className="flex items-center justify-between mb-8">
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Uploading payload...</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }} className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}

          <button 
            type="button"
            className="btn btn-primary w-full" 
            style={{ justifyContent: 'center', padding: '13px 20px', fontSize: '14px' }} 
            onClick={handleSubmit} 
            disabled={uploading || !file}
          >
            {uploading ? (
              <span>Processing Upload...</span>
            ) : scheduleType === 'now' ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload &amp; Dispatch Now</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Schedule Release</span>
              </>
            )}
          </button>
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
