import { useState } from 'react';
import type { VideoSource } from '../../types';
import './PlaylistModal.css';

interface PlaylistModalProps {
  playlist: VideoSource[];
  canControl: boolean;
  onUpdatePlaylist: (playlist: VideoSource[]) => void;
  onPlayNext: () => void;
  onClose: () => void;
}

export function PlaylistModal({
  playlist,
  canControl,
  onUpdatePlaylist,
  onPlayNext,
  onClose,
}: PlaylistModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a video URL.');
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setError('Please enter a valid URL.');
      return;
    }

    const newItem: VideoSource = {
      sourceType: 'url',
      url: trimmed,
      title: title.trim() || trimmed,
    };

    onUpdatePlaylist([...playlist, newItem]);
    setUrl('');
    setTitle('');
  }

  function handleRemove(index: number) {
    const updated = playlist.filter((_, i) => i !== index);
    onUpdatePlaylist(updated);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const updated = [...playlist];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    onUpdatePlaylist(updated);
  }

  return (
    <div className="playlist-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="playlist-modal glass animate-slide-up">
        <div className="playlist-header">
          <h2>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 4h12M3 9h12M3 14h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M13 12l3 2-3 2v-4z" fill="currentColor"/>
            </svg>
            Video Queue & Playlist ({playlist.length})
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close playlist">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Add video form */}
        {canControl && (
          <form className="playlist-add-form" onSubmit={handleAdd}>
            <div className="playlist-input-group">
              <input
                className="input"
                type="url"
                placeholder="Video URL (YouTube, Vimeo, MP4)..."
                value={url}
                onChange={e => { setUrl(e.target.value); setError(''); }}
              />
              <input
                className="input playlist-title-input"
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                + Add
              </button>
            </div>
            {error && <p className="playlist-error">{error}</p>}
          </form>
        )}

        {/* Queue list */}
        <div className="playlist-items">
          {playlist.length === 0 ? (
            <p className="playlist-empty">Queue is empty. Add URLs above to auto-play next!</p>
          ) : (
            playlist.map((item, idx) => (
              <div key={`${item.url}-${idx}`} className="playlist-item">
                <span className="playlist-idx">#{idx + 1}</span>
                <div className="playlist-info">
                  <p className="playlist-item-title">{item.title || item.url}</p>
                  <p className="playlist-item-url">{item.url}</p>
                </div>
                {canControl && (
                  <div className="playlist-actions">
                    {idx > 0 && (
                      <button
                        className="btn-icon btn-sm"
                        onClick={() => handleMoveUp(idx)}
                        title="Move Up"
                      >
                        ▲
                      </button>
                    )}
                    <button
                      className="btn-icon btn-sm danger"
                      onClick={() => handleRemove(idx)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="playlist-footer">
          {canControl && playlist.length > 0 && (
            <button className="btn btn-primary play-next-btn" onClick={onPlayNext}>
              ▶ Play Next Item Now
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
