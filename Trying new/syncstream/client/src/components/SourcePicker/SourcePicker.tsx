import { useState, useEffect } from 'react';
import type { FormEvent, DragEvent } from 'react';
import type { VideoSource } from '../../hooks/useRoom';
import { getServerUrl } from '../../socket';
import './SourcePicker.css';

interface SourcePickerProps {
  onConfirm: (source: VideoSource) => void;
  onSubtitlesLoaded?: (subtitleText: string | null) => void;
  onClose: () => void;
}

type PickerTab = 'url' | 'file';

const ALLOWED_MEDIA_TYPES = "video/*,audio/*,.mp4,.webm,.mkv,.mov,.avi,.flv,.wmv,.m4v,.3gp,.ogv,.ts,.mts,.m2ts,.divx,.mp3,.wav,.flac,.aac,.m4a,.ogg,.opus,.wma";
const ALLOWED_SUBTITLE_TYPES = ".vtt,.srt,.ass,.ssa,.sub,.txt,text/vtt,text/plain";

const DEMO_STREAMS = [
  { label: '🎬 Big Buck Bunny (1080p MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { label: '🚀 Tears of Steel (4K MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
  { label: '🐘 Elephant Dream (HD MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { label: '🚗 For Bigger Blazes (720p MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getMediaKind(filename: string): { label: string; icon: string } {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus', 'wma'].includes(ext)) {
    return { label: `AUDIO (${ext.toUpperCase()})`, icon: '🎵' };
  }
  if (['mkv', 'avi', 'mov', 'flv', 'wmv'].includes(ext)) {
    return { label: `CONTAINER (${ext.toUpperCase()})`, icon: '📦' };
  }
  return { label: `VIDEO (${ext.toUpperCase() || 'MEDIA'})`, icon: '🎬' };
}

export function SourcePicker({ onConfirm, onSubtitlesLoaded, onClose }: SourcePickerProps) {
  const [tab, setTab] = useState<PickerTab>('url');
  const [url, setUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  // Subtitle state
  const [subtitleText, setSubtitleText] = useState<string | null>(null);
  const [subtitleName, setSubtitleName] = useState('');

  async function processFileObj(file: File) {
    if (!file) return;
    if (fileUrl && fileUrl.startsWith('blob:')) {
      URL.revokeObjectURL(fileUrl);
    }

    const diskPath = (file as unknown as { path?: string }).path;
    if (diskPath) {
      try {
        const check = await fetch(`${getServerUrl()}/api/stream/health`, { method: 'GET' });
        if (check.ok) {
          const streamUrl = `${getServerUrl()}/api/stream?path=${encodeURIComponent(diskPath)}`;
          setFileUrl(streamUrl);
        } else {
          setFileUrl(URL.createObjectURL(file));
        }
      } catch {
        setFileUrl(URL.createObjectURL(file));
      }
    } else {
      const objectUrl = URL.createObjectURL(file);
      setFileUrl(objectUrl);
    }

    setFileName(file.name);
    setFileSize(file.size);
    setError('');
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFileObj(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFileObj(file);
    }
  }

  // Cleanup blob URL on unmount
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
      if (!fileUrl) { setError('Please select a local video or audio file.'); return; }
      onConfirm({ sourceType: 'file', url: fileUrl, title: fileName });
    }
    // Broadcast subtitles separately
    if (onSubtitlesLoaded) {
      onSubtitlesLoaded(subtitleText);
    }
  }

  const mediaMeta = fileName ? getMediaKind(fileName) : null;

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
            Choose Media Source
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
            🌐 Stream URL / YouTube
          </button>
          <button
            className={`source-tab ${tab === 'file' ? 'active' : ''}`}
            onClick={() => { setTab('file'); setError(''); }}
            id="source-tab-file"
          >
            📁 Local File (Video / Audio)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="source-form">
          {tab === 'url' ? (
            <div className="source-field">
              <label htmlFor="source-url-input" className="source-label">Stream or Video URL</label>
              <input
                id="source-url-input"
                className="input"
                type="url"
                placeholder="https://example.com/video.mp4"
                value={url}
                onChange={e => { setUrl(e.target.value); setError(''); }}
                autoFocus
              />
              <p className="source-hint">Supports YouTube, Vimeo, Twitch, and direct MP4 / WebM / HLS links.</p>

              {/* Demo presets */}
              <div className="source-presets-container">
                <span className="source-preset-title">Quick Demo Streams:</span>
                <div className="source-preset-chips">
                  {DEMO_STREAMS.map(stream => (
                    <button
                      key={stream.url}
                      type="button"
                      className="source-preset-chip"
                      onClick={() => setUrl(stream.url)}
                      title={`Load ${stream.label}`}
                    >
                      {stream.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="source-field">
              <label className="source-label">Select Video or Audio File</label>
              <label
                className={`source-file-label ${isDragging ? 'dragging' : ''} ${fileName ? 'has-file' : ''}`}
                htmlFor="source-file-input"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {fileName ? (
                  <div className="source-file-selected-box">
                    <div className="source-file-icon">{mediaMeta?.icon}</div>
                    <div className="source-file-meta">
                      <span className="source-file-name">{fileName}</span>
                      <div className="source-file-tags">
                        <span className="badge badge-accent">{mediaMeta?.label}</span>
                        {fileSize && <span className="source-file-size">{formatBytes(fileSize)}</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="source-file-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4v12M8 8l4-4 4 4" stroke="var(--accent-bright)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 18h16" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Drag & drop local media file here or click to browse</span>
                  </div>
                )}
              </label>
              <input
                id="source-file-input"
                type="file"
                accept={ALLOWED_MEDIA_TYPES}
                onChange={handleFile}
                className="source-file-input-hidden"
                aria-label="Select local video or audio file"
              />
              <p className="source-hint">
                <strong>Supported Formats:</strong> MP4, WebM, MKV, MOV, AVI, FLV, WMV, M4V, 3GP, OGV, TS, MP3, WAV, FLAC, AAC, M4A, OGG, OPUS, WMA. (Plays locally on your device with 0 upload delay).
              </p>
            </div>
          )}

          {/* ── Subtitle File (Optional) ─────────────────── */}
          <div className="source-subtitle-section">
            <div className="source-subtitle-divider">
              <span>Optional Subtitles</span>
            </div>
            <div className="source-field">
              <label className="source-label">Subtitle File (.vtt, .srt, .ass, .ssa, .txt)</label>
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
                    <span>Add subtitles (.srt, .vtt, .ass, .ssa)</span>
                  </>
                )}
              </label>
              <input
                id="source-subtitle-input"
                type="file"
                accept={ALLOWED_SUBTITLE_TYPES}
                onChange={handleSubtitleFile}
                className="source-file-input-hidden"
                aria-label="Select subtitle file"
              />
              <p className="source-hint">Broadcasting subtitles will synchronize subtitle cues for all watchers in the room.</p>
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
              Load Media
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
