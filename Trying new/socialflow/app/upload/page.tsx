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

  const showToast = (type: string, message: string) => { setToast({ type, message }); setTimeout(() => setToast(null), 4000); };

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('video/')) { showToast('error', 'Please select a video file'); return; }
    if (f.size > 500 * 1024 * 1024) { showToast('error', 'File too large (max 500MB)'); return; }
    setFile(f); setVideoPreview(URL.createObjectURL(f));
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }, [title]);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }, [handleFile]);
  const togglePlatform = (p: string) => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleSubmit = async () => {
    if (!file) { showToast('error', 'Please select a video'); return; }
    if (!title.trim()) { showToast('error', 'Please enter a title'); return; }
    if (platforms.length === 0) { showToast('error', 'Select at least one platform'); return; }
    setUploading(true); setUploadProgress(10);
    try {
      const formData = new FormData(); formData.append('file', file); setUploadProgress(30);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error); setUploadProgress(60);
      let scheduledAt = new Date().toISOString();
      if (scheduleType === 'scheduled' && scheduledDate && scheduledTime) scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      const postRes = await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: `${description.trim()}\n\n${hashtags.trim()}`, hashtags: hashtags.trim(),
          filePath: uploadData.filePath, fileName: uploadData.fileName, fileSize: uploadData.fileSize, platforms, scheduledAt }) });
      if (!postRes.ok) throw new Error('Failed to schedule post');
      setUploadProgress(100);
      showToast('success', scheduleType === 'now' ? 'Video queued for upload!' : 'Video scheduled successfully!');
      setTimeout(() => router.push('/scheduled'), 1500);
    } catch (err: any) { showToast('error', err.message || 'Something went wrong'); } finally { setUploading(false); }
  };

  return (
    <>
      <div className="page-header"><h2>Upload Video</h2><p>Upload a video to YouTube Shorts and Instagram Reels</p></div>
      <div className="grid-2">
        <div>
          {!file ? (
            <div className={`upload-zone ${dragOver ? 'dragover' : ''}`} onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
              <div className="upload-icon">🎬</div><h3>Drop your video here</h3><p>or click to browse • MP4, MOV, WebM • Max 500MB</p>
              <input ref={fileInputRef} type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
            </div>
          ) : (
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="file-preview"><video src={videoPreview} controls style={{ width: '100%', maxHeight: '350px' }} />
                <button className="remove-file" onClick={() => { setFile(null); setVideoPreview(''); }}>✕</button></div>
              <div style={{ padding: '16px' }}><div style={{ fontWeight: 600, fontSize: '14px' }}>{file.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{(file.size / (1024 * 1024)).toFixed(1)} MB</div></div>
            </div>
          )}
          <div style={{ marginTop: '20px' }}><label className="form-label">Post To</label>
            <div className="platform-select">
              <button className={`platform-option youtube ${platforms.includes('youtube') ? 'selected' : ''}`} onClick={() => togglePlatform('youtube')}>
                <div style={{ fontSize: '28px' }}>▶️</div><div className="platform-name">YouTube Shorts</div></button>
              <button className={`platform-option instagram ${platforms.includes('instagram') ? 'selected' : ''}`} onClick={() => togglePlatform('instagram')}>
                <div style={{ fontSize: '28px' }}>📸</div><div className="platform-name">Instagram Reels</div></button>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Post Details</h3>
          <div className="form-group"><label className="form-label">Title</label><input className="form-input" type="text" placeholder="Enter video title..." value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" placeholder="Enter video description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
          <div className="form-group"><label className="form-label">Hashtags</label><input className="form-input" type="text" placeholder="#shorts #reels #viral" value={hashtags} onChange={(e) => setHashtags(e.target.value)} /></div>
          <hr className="section-divider" />
          <div className="form-group"><label className="form-label">When to Post</label>
            <div className="tabs" style={{ marginBottom: '16px' }}>
              <button className={`tab ${scheduleType === 'now' ? 'active' : ''}`} onClick={() => setScheduleType('now')}>Post Now</button>
              <button className={`tab ${scheduleType === 'scheduled' ? 'active' : ''}`} onClick={() => setScheduleType('scheduled')}>Schedule</button>
            </div>
            {scheduleType === 'scheduled' && (<div className="datetime-input"><input className="form-input" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} /><input className="form-input" type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} /></div>)}
          </div>
          {uploading && (<div style={{ marginBottom: '16px' }}><div className="flex items-center justify-between mb-8"><span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Uploading...</span><span style={{ fontSize: '13px', fontWeight: 600 }}>{uploadProgress}%</span></div><div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div></div></div>)}
          <button className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: '14px 20px', fontSize: '15px' }} onClick={handleSubmit} disabled={uploading || !file}>
            {uploading ? '⏳ Processing...' : scheduleType === 'now' ? '🚀 Upload Now' : '📅 Schedule Post'}
          </button>
        </div>
      </div>
      {toast && <div className="toast-container"><div className={`toast ${toast.type}`}>{toast.message}</div></div>}
    </>
  );
}
