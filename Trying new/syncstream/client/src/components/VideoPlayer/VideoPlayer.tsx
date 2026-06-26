import {
  useRef, useEffect, useState, useCallback
} from 'react';
import type { ChangeEvent } from 'react';
import ReactPlayer from 'react-player';
import { socket } from '../../socket';
import type { VideoSource } from '../../hooks/useRoom';
import './VideoPlayer.css';

interface VideoPlayerProps {
  isHost: boolean;
  videoSource: VideoSource | null;
  onPlay: (currentTime: number) => void;
  onPause: (currentTime: number) => void;
  onSeek: (currentTime: number) => void;
  onLocalStream: (stream: MediaStream) => void;
  remoteStreamRef: React.MutableRefObject<MediaStream | null>;
  onRequestStream: () => void;
}

function formatDuration(secs: number): string {
  if (!isFinite(secs) || isNaN(secs) || secs < 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type VideoEl = HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream };

function captureVideoStream(video: VideoEl): MediaStream | null {
  if (typeof video.captureStream === 'function') return video.captureStream();
  if (typeof video.mozCaptureStream === 'function') return video.mozCaptureStream();
  return null;
}

export function VideoPlayer({
  isHost,
  videoSource,
  onPlay,
  onPause,
  onSeek,
  onLocalStream,
  remoteStreamRef,
  onRequestStream,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reactPlayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying]           = useState(false);
  const [currentTime, setCurrentTime]   = useState(0);
  const [duration, setDuration]         = useState(0);
  const [volume, setVolume]             = useState(1);
  const [muted, setMuted]               = useState(false);
  const [fullscreen, setFullscreen]     = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered]         = useState(0);
  const [isLoading, setIsLoading]       = useState(false);
  const [videoError, setVideoError]     = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usingObjectStream = useRef(false);
  const streamCaptured = useRef(false);

  const isUrl = videoSource?.sourceType === 'url';
  const isFile = videoSource?.sourceType === 'file';

  // ── (1) SOURCE MANAGEMENT ────────────────────────────────────────
  useEffect(() => {
    // Reset state when source changes
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setVideoError(null);
    streamCaptured.current = false;

    if (!videoSource) {
      usingObjectStream.current = false;
      setIsLoading(false);
      if (videoRef.current) {
        if (videoRef.current.srcObject) videoRef.current.srcObject = null;
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
      return;
    }

    if (isUrl) {
      // ReactPlayer handles URLs directly. Show loading until onReady fires.
      usingObjectStream.current = false;
      setIsLoading(true);
    } else if (isFile) {
      const video = videoRef.current;
      if (!video) return;
      
      if (isHost) {
        usingObjectStream.current = false;
        setIsLoading(true);
        if (video.srcObject) video.srcObject = null;
        video.src = videoSource.url;
        video.load();
      } else {
        usingObjectStream.current = false;
        setIsLoading(true);
        if (video.srcObject) video.srcObject = null;
        video.removeAttribute('src');
        video.load();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSource, isHost]);

  // ── (2) VOLUME & MUTED — apply immediately and on source change ──
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = muted;
    }
  }, [volume, muted, videoSource]);

  // ── (3) GUEST SYNC EVENTS FROM SERVER ───────────────────────────
  useEffect(() => {
    if (isHost) return;

    function applySync(action: 'play' | 'pause' | 'seek', time: number) {
      if (videoSource?.sourceType === 'url') {
        const rp = reactPlayerRef.current;
        if (rp && (action === 'seek' || action === 'play')) {
          rp.seekTo(time, 'seconds');
        }
        if (action === 'play') setPlaying(true);
        if (action === 'pause') setPlaying(false);
      } else {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = time;
        if (action === 'play') {
          video.play().catch(() => {});
          setPlaying(true);
        } else if (action === 'pause') {
          video.pause();
          setPlaying(false);
        }
      }
    }

    socket.on('sync-play',  ({ currentTime: t }: { currentTime: number }) => applySync('play',  t));
    socket.on('sync-pause', ({ currentTime: t }: { currentTime: number }) => applySync('pause', t));
    socket.on('sync-seek',  ({ currentTime: t }: { currentTime: number }) => applySync('seek',  t));

    // Periodic heartbeat sync — correct drift > 2 seconds
    socket.on('sync-heartbeat', ({ currentTime: hostTime, playing: hostPlaying }: { currentTime: number; playing: boolean }) => {
      if (videoSource?.sourceType === 'url') {
        const rp = reactPlayerRef.current;
        if (rp) {
          const guestTime = rp.getCurrentTime?.() ?? 0;
          if (Math.abs(guestTime - hostTime) > 2) {
            rp.seekTo(hostTime, 'seconds');
          }
        }
        setPlaying(hostPlaying);
      } else {
        const video = videoRef.current;
        if (video && isFinite(video.currentTime)) {
          if (Math.abs(video.currentTime - hostTime) > 2) {
            video.currentTime = hostTime;
          }
          if (hostPlaying && video.paused) {
            video.play().catch(() => {});
          } else if (!hostPlaying && !video.paused) {
            video.pause();
          }
          setPlaying(hostPlaying);
        }
      }
    });

    return () => {
      socket.off('sync-play');
      socket.off('sync-pause');
      socket.off('sync-seek');
      socket.off('sync-heartbeat');
    };
  }, [isHost, videoSource]);

  // ── (3b) HOST: send periodic heartbeat every 5 seconds ──────────
  useEffect(() => {
    if (!isHost || !videoSource) return;

    const interval = setInterval(() => {
      let t = 0;
      if (isUrl) {
        t = reactPlayerRef.current?.getCurrentTime?.() ?? 0;
      } else {
        t = videoRef.current?.currentTime ?? 0;
      }
      socket.emit('sync-heartbeat', { currentTime: t, playing });
    }, 5000);

    return () => clearInterval(interval);
  }, [isHost, videoSource, isUrl, playing]);

  // ── (4) GUEST WEBRTC STREAM — only for file-type sources ────────
  useEffect(() => {
    if (isHost || !isFile) return;

    onRequestStream();
    console.log('[VideoPlayer] Guest waiting for WebRTC stream...');

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;
      if (remoteStreamRef.current && !usingObjectStream.current) {
        console.log('[VideoPlayer] Remote stream arrived, applying to video element');
        const stream = remoteStreamRef.current;
        const audioTracks = stream.getAudioTracks();
        const videoTracks = stream.getVideoTracks();
        console.log('[VideoPlayer] Stream tracks — audio:', audioTracks.length, 'video:', videoTracks.length);
        
        usingObjectStream.current = true;
        video.removeAttribute('src');
        video.srcObject = stream;
        // FIX: Explicitly set volume and unmute for WebRTC stream
        video.volume = volume;
        video.muted = false;
        setMuted(false);
        video.play().catch(err => {
          console.warn('[VideoPlayer] Autoplay blocked:', err.message);
          // If autoplay is blocked, try muted autoplay first then unmute
          video.muted = true;
          video.play().then(() => {
            // After playing muted, unmute after a short delay
            setTimeout(() => {
              video.muted = false;
              video.volume = volume;
              setMuted(false);
            }, 100);
          }).catch(() => {});
        });
        setIsLoading(false);
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, isFile]);

  // ── (5) NATIVE VIDEO EVENT HANDLERS (for Local Files) ────────────
  function handleNativeTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }
  }

  function handleNativeDurationChange() {
    const video = videoRef.current;
    if (!video) return;
    const d = video.duration;
    if (isFinite(d)) setDuration(d);
  }

  function handleNativeLoadedData() {
    const video = videoRef.current;
    if (!video) return;
    
    const d = video.duration;
    if (isFinite(d)) setDuration(d);
    
    // FIX: Apply volume settings once the video data is actually loaded
    video.volume = volume;
    video.muted = muted;
    setIsLoading(false);
    
    console.log('[VideoPlayer] loadeddata — volume:', video.volume, 'muted:', video.muted);
  }

  function handleNativePlay() {
    setPlaying(true);
    if (isHost && isFile) {
      const video = videoRef.current as VideoEl | null;
      if (!video || streamCaptured.current) return;
      
      // FIX: Use a small delay to ensure audio tracks are available in the capture
      setTimeout(() => {
        if (!video) return;
        const stream = captureVideoStream(video);
        if (stream) {
          const tracks = stream.getTracks();
          const audioTracks = stream.getAudioTracks();
          const videoTracks = stream.getVideoTracks();
          console.log('[VideoPlayer] captureStream — total:', tracks.length, 'audio:', audioTracks.length, 'video:', videoTracks.length);
          
          if (tracks.length > 0) {
            streamCaptured.current = true;
            onLocalStream(stream);
          }
        }
      }, 200);
    }
  }

  function handleNativePause()  { setPlaying(false); }
  function handleNativeEnded()  { setPlaying(false); }

  // FIX: Handle video loading errors
  function handleNativeError() {
    setIsLoading(false);
    setVideoError('Failed to load video file. Please check the file format.');
  }

  // ── (6) CONTROLS ─────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (!isHost) return;
    
    if (isUrl) {
      const newPlaying = !playing;
      setPlaying(newPlaying);
      if (newPlaying) {
        onPlay(currentTime);
      } else {
        onPause(currentTime);
      }
    } else {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        video.play().catch(() => {});
        setPlaying(true);
        onPlay(video.currentTime);
      } else {
        video.pause();
        setPlaying(false);
        onPause(video.currentTime);
      }
    }
  }, [isHost, onPlay, onPause, isUrl, playing, currentTime]);

  function handleSeek(e: ChangeEvent<HTMLInputElement>) {
    if (!isHost) return;
    const t = Number(e.target.value);
    setCurrentTime(t);
    onSeek(t);
    
    if (isUrl) {
      reactPlayerRef.current?.seekTo(t, 'seconds');
    } else {
      const video = videoRef.current;
      if (video) video.currentTime = t;
    }
  }

  function handleVolumeChange(e: ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    // FIX: Only set on native video element when it exists and we're using it
    if (!isUrl) {
      const video = videoRef.current;
      if (video) {
        video.volume = v;
        video.muted = v === 0;
      }
    }
    // ReactPlayer volume is handled via its `volume` prop reactively
  }

  function toggleMute() {
    const newMuted = !muted;
    setMuted(newMuted);
    if (!isUrl) {
      const video = videoRef.current;
      if (video) video.muted = newMuted;
    }
    // ReactPlayer mute is handled via its `volume` prop (set to 0 when muted)
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  function resetHideTimer() {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }

  // ── (7) KEYBOARD SHORTCUTS ──────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          if (!isHost) return;
          e.preventDefault();
          {
            const newTime = Math.max(0, currentTime - 10);
            setCurrentTime(newTime);
            onSeek(newTime);
            if (isUrl) {
              reactPlayerRef.current?.seekTo(newTime, 'seconds');
            } else {
              const video = videoRef.current;
              if (video) video.currentTime = newTime;
            }
          }
          break;
        case 'ArrowRight':
          if (!isHost) return;
          e.preventDefault();
          {
            const newTime = Math.min(duration, currentTime + 10);
            setCurrentTime(newTime);
            onSeek(newTime);
            if (isUrl) {
              reactPlayerRef.current?.seekTo(newTime, 'seconds');
            } else {
              const video = videoRef.current;
              if (video) video.currentTime = newTime;
            }
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, isHost, currentTime, duration, isUrl, onSeek]);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent  = duration > 0 ? (buffered  / duration) * 100 : 0;
  const hasSource = !!videoSource;
  const guestWaitingForStream = !isHost && isFile && !usingObjectStream.current;

  return (
    <div
      className={`vp-container ${showControls || !playing ? 'show-controls' : 'hide-controls'}`}
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
      onTouchStart={resetHideTimer}
      tabIndex={0}
    >
      {/* Native Video element (for Local Files) */}
      {(!hasSource || isFile) && (
        <video
          ref={videoRef}
          className="vp-video"
          onTimeUpdate={handleNativeTimeUpdate}
          onDurationChange={handleNativeDurationChange}
          onLoadedData={handleNativeLoadedData}
          onPlay={handleNativePlay}
          onPause={handleNativePause}
          onEnded={handleNativeEnded}
          onError={handleNativeError}
          onClick={isHost ? togglePlay : undefined}
          playsInline
          muted={false}
        />
      )}

      {/* ReactPlayer (for YouTube, Vimeo, direct URLs) */}
      {hasSource && isUrl && (
        <div className="vp-video" onClick={isHost ? togglePlay : undefined}>
          <ReactPlayer
            ref={reactPlayerRef}
            url={videoSource.url}
            playing={playing}
            volume={muted ? 0 : volume}
            muted={muted}
            width="100%"
            height="100%"
            controls={false}
            onReady={() => {
              console.log('[VideoPlayer] ReactPlayer ready');
              setIsLoading(false);
              setVideoError(null);
            }}
            onError={(err: unknown) => {
              console.error('[VideoPlayer] ReactPlayer error:', err);
              setIsLoading(false);
              setVideoError('Failed to load video. Please check the URL and try again.');
            }}
            onProgress={(state: { playedSeconds: number; loadedSeconds: number }) => {
              setCurrentTime(state.playedSeconds);
              setBuffered(state.loadedSeconds);
            }}
            onDuration={(d: number) => setDuration(d)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onBuffer={() => setIsLoading(true)}
            onBufferEnd={() => setIsLoading(false)}
            style={{ pointerEvents: 'none' }}
            config={{
              youtube: {
                playerVars: {
                  autoplay: 0,
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                  iv_load_policy: 3,
                  fs: 0,
                  disablekb: 1,
                  origin: window.location.origin,
                },
              },
            }}
          />
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && hasSource && (
        <div className="vp-loading-overlay">
          <div className="vp-spinner" />
          <p className="vp-loading-text">
            {isUrl ? 'Loading stream…' : 'Loading video…'}
          </p>
        </div>
      )}

      {/* Error overlay */}
      {videoError && (
        <div className="vp-error-overlay">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="#ef4444" strokeWidth="2"/>
            <path d="M20 12v10M20 26v2" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <p className="vp-error-text">{videoError}</p>
          {isHost && (
            <button className="btn btn-ghost vp-error-retry" onClick={() => setVideoError(null)}>
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Placeholders... */}
      {!hasSource && (
        <div className="vp-placeholder">
          <div className="vp-placeholder-icon">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="26" stroke="url(#gvp)" strokeWidth="1.5" strokeDasharray="4 4"/>
              <path d="M21 18l18 10-18 10V18z" fill="url(#gvp)"/>
              <defs>
                <linearGradient id="gvp" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c3aed"/><stop offset="1" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="vp-placeholder-text">
            {isHost ? 'Click "Load Video" above to choose a video source' : 'Waiting for host to load a video…'}
          </p>
          {!isHost && <span className="badge badge-accent"><span className="vp-waiting-dot" /> Waiting</span>}
        </div>
      )}

      {guestWaitingForStream && (
        <div className="vp-placeholder">
          <div className="vp-placeholder-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="url(#gvp2)" strokeWidth="1.5"/>
              <path d="M24 14v10l6 6" stroke="url(#gvp2)" strokeWidth="2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="gvp2" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c3aed"/><stop offset="1" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="vp-placeholder-text">Connecting to host's stream…</p>
          <span className="badge badge-accent"><span className="vp-waiting-dot" /> Syncing</span>
        </div>
      )}

      {/* Controls overlay */}
      <div className="vp-controls" role="group" aria-label="Video controls">
        {!isHost && hasSource && !guestWaitingForStream && (
          <div className="vp-guest-notice">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M6 5v3M6 3.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Host controls playback
          </div>
        )}

        <div className="vp-progress-area">
          <div className="vp-progress-track">
            <div className="vp-progress-buffered" style={{ width: `${bufferedPercent}%` }} />
            <div className="vp-progress-fill" style={{ width: `${progressPercent}%` }} />
            <input
              type="range"
              className="vp-progress-input"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!isHost || !hasSource || duration === 0}
              aria-label="Seek"
              id="vp-seek-slider"
            />
          </div>
        </div>

        <div className="vp-bottom-bar">
          <div className="vp-left-controls">
            <button
              className="btn-icon vp-btn"
              onClick={togglePlay}
              disabled={!isHost || !hasSource}
              aria-label={playing ? 'Pause' : 'Play'}
              id="vp-play-btn"
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="4" y="3" width="3.5" height="12" rx="1" fill="currentColor"/>
                  <rect x="10.5" y="3" width="3.5" height="12" rx="1" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M5 3.5l11 5.5-11 5.5V3.5z" fill="currentColor"/>
                </svg>
              )}
            </button>

            <div className="vp-volume-group">
              <button
                className="btn-icon vp-btn"
                onClick={toggleMute}
                aria-label={muted ? 'Unmute' : 'Mute'}
                id="vp-mute-btn"
              >
                {muted || volume === 0 ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 6.5h3l4-3.5v12l-4-3.5H3V6.5z" fill="currentColor" opacity=".5"/>
                    <path d="M12 7l3 4M15 7l-3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : volume < 0.5 ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 6.5h3l4-3.5v12l-4-3.5H3V6.5z" fill="currentColor"/>
                    <path d="M12 7a3 3 0 010 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 6.5h3l4-3.5v12l-4-3.5H3V6.5z" fill="currentColor"/>
                    <path d="M12 6a4 4 0 010 6M14 4a7 7 0 010 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
              <input
                type="range"
                className="vp-volume-slider"
                min={0} max={1} step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume"
                id="vp-volume-slider"
              />
            </div>

            <span className="vp-time">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          <div className="vp-right-controls">
            <button
              className="btn-icon vp-btn"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              id="vp-fullscreen-btn"
            >
              {fullscreen ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M6 3v3H3M12 3v3h3M6 15v-3H3M12 15v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 6V3h3M12 3h3v3M15 12v3h-3M6 15H3v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
