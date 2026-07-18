import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { VideoSource } from '../../hooks/useRoom';
import './SourcePicker.css';

interface SourcePickerProps {
  onConfirm: (source: VideoSource) => void;
  onSubtitlesLoaded?: (subtitleText: string | null) => void;
  onClose: () => void;
}

type PickerTab = 'url' | 'file';

export function SourcePicker({ onConfirm, onSubtitlesLoaded, onClose }: SourcePickerProps) {
  const [tab, setTab] = useState<PickerTab>('url');
  const [url, setUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  // Subtitle state
  const [subtitleText, setSubtitleText] = useState<string | null>(null);
  const [subtitleName, setSubtitleName] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke previous blob URL to prevent memory leaks on large files
    if (fileUrl && fileUrl.startsWith('blob:')) {
      URL.revokeObjectURL(fileUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    setFileName(file.name);
    setError('');
  }

  // Cleanup blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (fileUrl && fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  function handleSubtitleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubtitleName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setSubtitleText(text);
    };
    reader.onerror = () => {
      setError('Failed to read subtitle file.');
    };
    reader.readAsText(file);
  }

  function clearSubtitle() {
    setSubtitleText(null);
    setSubtitleName('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (tab === 'url') {
      const trimmed = url.trim();
      if (!trimmed) { setError('Please enter a video URL.'); return; }
      try { new URL(trimmed); } catch { setError('Please enter a valid URL.'); return; }
      onConfirm({ sourceType: 'url', url: trimmed });
    } else {
      if (!fileUrl) { setError('Please select a video file.'); return; }
      onConfirm({ sourceType: 'file', url: fileUrl });
    }
    // Broadcast subtitles separately
    if (onSubtitlesLoaded) {
      onSubtitlesLoaded(subtitleText);
    }
  }

  return (
    <div className="source-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="source-modal glass animate-slide-up">
        <div className="source-modal-header">
          <h2 className="source-modal-title">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="3" width="16" height="12" rx="2" stroke="url(#gs)" strokeWidth="1.5"/>
              <path d="M7 6.5l4 2.5-4 2.5V6.5z" fill="url(#gs)"/>
              <defs>
                <linearGradient id="gs" x1="0" y1="0" x2="18" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c3aed"/><stop offset="1" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
            </svg>
            Choose Video Source
          </h2>
          <button className="btn-icon" onClick={onClose} id="source-close-btn" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="source-tabs">
          <button
            className={`source-tab ${tab === 'url' ? 'active' : ''}`}
            onClick={() => { setTab('url'); setError(''); }}
            id="source-tab-url"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5.5 8.5a3.5 3.5 0 000-3 3.5 3.5 0 000 3zM8.5 5.5a3.5 3.5 0 010 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M2 7a5 5 0 0110 0 5 5 0 01-10 0z" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            Stream URL
          </button>
          <button
            className={`source-tab ${tab === 'file' ? 'active' : ''}`}
            onClick={() => { setTab('file'); setError(''); }}
            id="source-tab-file"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3a1 1 0 011-1h5l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M8 2v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Local File
          </button>
        </div>

        <form onSubmit={handleSubmit} className="source-form">
          {tab === 'url' ? (
            <div className="source-field">
              <label htmlFor="source-url-input" className="source-label">Video URL (mp4, webm, etc.)</label>
              <input
                id="source-url-input"
                className="input"
                type="url"
                placeholder="https://example.com/video.mp4"
                value={url}
                onChange={e => { setUrl(e.target.value); setError(''); }}
                autoFocus
              />
              <p className="source-hint">Paste a link to YouTube, Vimeo, Twitch, or a direct mp4/webm file.</p>
            </div>
          ) : (
            <div className="source-field">
              <label className="source-label">Select a video file</label>
              <label className="source-file-label" htmlFor="source-file-input">
                {fileName ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l4 4 6-7" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="source-file-name">{fileName}</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 3v8M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Click to choose a file</span>
                  </>
                )}
              </label>
              <input
                id="source-file-input"
                type="file"
                accept="video/*"
                onChange={handleFile}
                className="source-file-input-hidden"
                aria-label="Select video file"
              />
              <p className="source-hint">mp4, webm, mov, mkv supported. File stays local to you.</p>
            </div>
          )}

          {/* ── Subtitle file (optional) ─────────────────── */}
          <div className="source-subtitle-section">
            <div className="source-subtitle-divider">
              <span>Optional</span>
            </div>
            <div className="source-field">
              <label className="source-label">Subtitle File (.srt, .vtt)</label>
              <label className="source-file-label source-subtitle-label" htmlFor="source-subtitle-input">
                {subtitleName ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l4 4 6-7" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="source-file-name">{subtitleName}</span>
                    <button
                      type="button"
                      className="source-subtitle-clear"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearSubtitle(); }}
                      aria-label="Remove subtitle"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                      <path d="M3 8h4M3 10h6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                    <span>Add subtitles (optional)</span>
                  </>
                )}
              </label>
              <input
                id="source-subtitle-input"
                type="file"
                accept=".vtt,.srt"
                onChange={handleSubtitleFile}
                className="source-file-input-hidden"
                aria-label="Select subtitle file"
              />
              <p className="source-hint">Foreign language? Add .srt or .vtt subtitles for everyone in the room.</p>
            </div>
          </div>

          {error && (
            <div className="source-error animate-fade-in" role="alert">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.3"/>
                <path d="M7 4.5V7M7 9.5v.3" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <div className="source-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} id="source-cancel-btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="source-confirm-btn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 7l4-3v6L4 7z" fill="currentColor"/>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              Load Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

