import {
  useRef, useEffect, useState, useCallback
} from 'react';
import type { ChangeEvent } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { socket } from '../../socket';
import type { VideoSource, EmojiReaction } from '../../types';
import type { SubtitleCue } from '../../utils/subtitleParser';
import { VideoPlayerSkeleton } from '../Skeleton/Skeleton';
import { SubtitleOverlay } from './SubtitleOverlay';
import { EmojiReactions } from './EmojiReactions';
import './VideoPlayer.css';

interface VideoPlayerProps {
  isHost: boolean;
  canControl: boolean;
  videoSource: VideoSource | null;
  subtitleCues: SubtitleCue[];
  activeReactions?: EmojiReaction[];
  onPlay: (currentTime: number) => void;
  onPause: (currentTime: number) => void;
  onSeek: (currentTime: number) => void;
  onEnded?: () => void;
  onLocalStream: (stream: MediaStream) => void;
  remoteStreamRef: React.MutableRefObject<MediaStream | null>;
  onRequestStream: () => void;
}

const ALLOWED_MEDIA_TYPES = "video/*,audio/*,.mp4,.webm,.mkv,.mov,.avi,.flv,.wmv,.m4v,.3gp,.ogv,.ts,.mts,.m2ts,.divx,.mp3,.wav,.flac,.aac,.m4a,.ogg,.opus,.wma";

function formatDuration(secs: number): string {
  if (!isFinite(secs) || isNaN(secs) || secs < 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type VideoEl = HTMLVideoElement & { captureStream?: (fps?: number) => MediaStream; mozCaptureStream?: (fps?: number) => MediaStream };

function captureVideoStream(video: VideoEl, fps = 24): MediaStream | null {
  if (typeof video.captureStream === 'function') return video.captureStream(fps);
  if (typeof video.mozCaptureStream === 'function') return video.mozCaptureStream(fps);
  return null;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

export function VideoPlayer({
  isHost,
  canControl,
  videoSource,
  subtitleCues,
  activeReactions = [],
  onPlay,
  onPause,
  onSeek,
  onEnded,
  onLocalStream,
  remoteStreamRef,
  onRequestStream,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<Plyr | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioBoost, setAudioBoost] = useState(1); // 1.0 = 100%, 3.0 = 300%
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [audioReady, setAudioReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [syncDrift, setSyncDrift] = useState(0);
  const [showSyncBanner, setShowSyncBanner] = useState(false);
  const [guestAudioBlocked, setGuestAudioBlocked] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usingObjectStream = useRef(false);
  const [usingObjectStreamState, setUsingObjectStreamState] = useState(false);
  const streamCaptured = useRef(false);
  const plyrInitialized = useRef(false);
  const [subtitlesVisible, setSubtitlesVisible] = useState(true);
  const [guestLocalFileUrl, setGuestLocalFileUrl] = useState<string | null>(null);

  // Web Audio API refs for persistent audio streaming
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const connectedAudioSources = useRef<WeakMap<HTMLVideoElement, MediaElementAudioSourceNode>>(new WeakMap());

  const isUrl = videoSource?.sourceType === 'url';
  const isFile = videoSource?.sourceType === 'file';
  const isYouTube = isUrl && videoSource ? !!extractYouTubeId(videoSource.url) : false;
  const isVimeo = isUrl && videoSource ? !!extractVimeoId(videoSource.url) : false;
  const isEmbedProvider = isYouTube || isVimeo;

  // Hide skeleton after mount
  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // ── (1) PLYR INITIALIZATION FOR EMBED PROVIDERS ─────────────────
  useEffect(() => {
    if (!isEmbedProvider || !videoSource) return;

    // Clean up previous Plyr instance
    if (plyrRef.current) {
      plyrRef.current.destroy();
      plyrRef.current = null;
      plyrInitialized.current = false;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setVideoError(null);
    setIsLoading(true);
    setLoadingStatus('Loading stream…');
    setAudioReady(false);
    setVideoReady(false);
    streamCaptured.current = false;

    // Wait for DOM to render the embed div
    const timer = setTimeout(() => {
      const embedEl = document.getElementById('plyr-embed-target');
      if (!embedEl) return;

      let provider: 'youtube' | 'vimeo' = 'youtube';
      let embedId = '';

      if (isYouTube) {
        provider = 'youtube';
        embedId = extractYouTubeId(videoSource.url) || '';
      } else if (isVimeo) {
        provider = 'vimeo';
        embedId = extractVimeoId(videoSource.url) || '';
      }

      embedEl.setAttribute('data-plyr-provider', provider);
      embedEl.setAttribute('data-plyr-embed-id', embedId);

      const player = new Plyr(embedEl, {
        controls: [], // We use custom controls
        clickToPlay: false,
        youtube: {
          noCookie: true,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          modestbranding: 1,
        },
        vimeo: {
          byline: false,
          portrait: false,
          title: false,
          speed: true,
          transparent: false,
        },
      });

      plyrRef.current = player;
      plyrInitialized.current = true;

      player.on('ready', () => {
        console.log('[VideoPlayer] Plyr embed ready');
        setIsLoading(false);
        setVideoError(null);
        setVideoReady(true);
        setAudioReady(true);
      });

      player.on('timeupdate', () => {
        setCurrentTime(player.currentTime);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (player as any).on('durationchange', () => {
        if (isFinite(player.duration)) setDuration(player.duration);
      });

      player.on('playing', () => {
        setPlaying(true);
        setIsLoading(false);
      });
      player.on('pause', () => setPlaying(false));
      player.on('ended', () => setPlaying(false));

      player.on('waiting', () => {
        if (!player.playing) {
          setIsLoading(true);
          setLoadingStatus('Buffering…');
        }
      });
      player.on('canplay', () => {
        setIsLoading(false);
      });

      player.on('error', () => {
        setIsLoading(false);
        setVideoError('Failed to load video. Please check the URL and try again.');
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (plyrRef.current) {
        plyrRef.current.destroy();
        plyrRef.current = null;
        plyrInitialized.current = false;
      }
    };
  }, [videoSource, isEmbedProvider, isYouTube, isVimeo]);

  // ── (1b) SOURCE MANAGEMENT FOR FILE / DIRECT URL ────────────────
  // Async MediaStream Compositor — deterministic audio/video extraction without retry loops
  async function composeStreamWithAudio(video: VideoEl): Promise<MediaStream | null> {
    const rawStream = captureVideoStream(video, 24);
    if (!rawStream) {
      console.warn('[Compositor] captureStream() returned null');
      return null;
    }

    const masterStream = new MediaStream();
    const videoTracks = rawStream.getVideoTracks();
    const nativeAudioTracks = rawStream.getAudioTracks();

    // Step 1: Add video tracks
    videoTracks.forEach(t => masterStream.addTrack(t));
    if (videoTracks.length === 0) {
      console.warn('[Compositor] No video tracks captured');
      return null;
    }

    // Step 2: Prefer native audio tracks if available and live
    const liveNativeAudio = nativeAudioTracks.filter(t => t.readyState === 'live');
    if (liveNativeAudio.length > 0) {
      masterStream.addTrack(liveNativeAudio[0]);
      console.log('[Compositor] Using native captureStream audio track');
      setAudioReady(true);
      return masterStream;
    }

    // Step 3: Fallback — Web Audio bridge (only if native audio absent)
    console.log('[Compositor] No native audio — initializing Web Audio bridge');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      // Ensure AudioContext is running (not suspended by autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      if (ctx.state !== 'running') {
        console.warn('[Compositor] AudioContext state:', ctx.state, '— audio may be silent');
      }

      audioCtxRef.current = ctx;
      let source = connectedAudioSources.current.get(video);
      if (!source) {
        source = ctx.createMediaElementSource(video);
        connectedAudioSources.current.set(video, source);
      }
      const gainNode = ctx.createGain();
      gainNode.gain.value = audioBoost;
      gainNodeRef.current = gainNode;

      const dest = ctx.createMediaStreamDestination();
      source.connect(gainNode);
      gainNode.connect(dest);
      gainNode.connect(ctx.destination); // Host local playback
      audioSourceRef.current = source;
      audioDestRef.current = dest;

      const bridgeAudioTrack = dest.stream.getAudioTracks()[0];
      if (bridgeAudioTrack && bridgeAudioTrack.readyState === 'live') {
        masterStream.addTrack(bridgeAudioTrack);
        console.log('[Compositor] Web Audio bridge audio track added');
        setAudioReady(true);
      } else {
        console.warn('[Compositor] Web Audio bridge produced no live audio track');
      }
    } catch (e) {
      console.warn('[Compositor] Failed to initialize AudioContext:', e);
    }

    return masterStream;
  }

  function cleanupWebAudio() {
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    audioSourceRef.current = null;
    audioDestRef.current = null;
  }

  useEffect(() => {
    if (isEmbedProvider) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setVideoError(null);
    setAudioReady(false);
    setVideoReady(false);
    streamCaptured.current = false;
    setGuestLocalFileUrl(null);
    cleanupWebAudio();

    // Clean up Plyr if switching from embed to file
    if (plyrRef.current) {
      plyrRef.current.destroy();
      plyrRef.current = null;
      plyrInitialized.current = false;
    }

    if (!videoSource) {
      usingObjectStream.current = false;
      setUsingObjectStreamState(false);
      setIsLoading(false);
      if (videoRef.current) {
        if (videoRef.current.srcObject) videoRef.current.srcObject = null;
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
      return;
    }

    if (isUrl) {
      const video = videoRef.current;
      if (!video) return;
      usingObjectStream.current = false;
      setUsingObjectStreamState(false);
      setIsLoading(true);
      setLoadingStatus('Loading video…');
      if (video.srcObject) video.srcObject = null;
      video.src = videoSource.url;
      video.load();
    } else if (isFile) {
      const video = videoRef.current;
      if (!video) return;

      if (isHost || guestLocalFileUrl) {
        usingObjectStream.current = false;
        setUsingObjectStreamState(false);
        setIsLoading(true);
        setLoadingStatus('Loading local media file…');
        if (video.srcObject) video.srcObject = null;
        video.src = guestLocalFileUrl || videoSource.url;
        video.load();
      } else {
        usingObjectStream.current = false;
        setUsingObjectStreamState(false);
        setIsLoading(true);
        setLoadingStatus('Connecting to host stream…');
        if (video.srcObject) video.srcObject = null;
        video.removeAttribute('src');
        video.load();
      }
    }

    return () => {
      cleanupWebAudio();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSource, isHost, isEmbedProvider]);

  // ── (2) VOLUME & MUTED ─────────────────────────────────────────
  useEffect(() => {
    if (isEmbedProvider && plyrRef.current) {
      plyrRef.current.volume = volume;
      plyrRef.current.muted = muted;
    }
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = muted;
    }
  }, [volume, muted, videoSource, isEmbedProvider]);

  // ── (3) GUEST SYNC EVENTS FROM SERVER ──────────────────────────
  useEffect(() => {
    if (isHost) return;

    function getPlayer() {
      if (isEmbedProvider && plyrRef.current) return { type: 'plyr' as const, player: plyrRef.current };
      if (videoRef.current) return { type: 'native' as const, player: videoRef.current };
      return null;
    }

    function applySync(action: 'play' | 'pause' | 'seek', time: number) {
      const p = getPlayer();
      if (!p) return;

      if (p.type === 'plyr') {
        if (action === 'seek' || action === 'play') {
          p.player.currentTime = time;
        }
        if (action === 'play') { p.player.play(); setPlaying(true); }
        if (action === 'pause') { p.player.pause(); setPlaying(false); }
      } else {
        p.player.currentTime = time;
        if (action === 'play') {
          p.player.play().catch(() => {});
          setPlaying(true);
        } else if (action === 'pause') {
          p.player.pause();
          setPlaying(false);
        }
      }
    }

    socket.on('sync-play', ({ currentTime: t }: { currentTime: number }) => applySync('play', t));
    socket.on('sync-pause', ({ currentTime: t }: { currentTime: number }) => applySync('pause', t));
    socket.on('sync-seek', ({ currentTime: t }: { currentTime: number }) => applySync('seek', t));

    // Periodic heartbeat sync — playbackRate micro-adjustment for smooth drift correction
    socket.on('sync-heartbeat', ({ currentTime: hostTime, playing: hostPlaying }: { currentTime: number; playing: boolean }) => {
      const p = getPlayer();
      if (!p) return;

      const guestTime = p.type === 'plyr'
        ? p.player.currentTime
        : (isFinite(p.player.currentTime) ? p.player.currentTime : 0);

      const drift = Math.abs(guestTime - hostTime);
      setSyncDrift(drift);

      // Smooth drift correction via playbackRate micro-adjustments
      if (drift > 2) {
        // Large drift — show banner, let user decide
        setShowSyncBanner(true);
        // Reset playbackRate if it was adjusted
        if (p.type !== 'plyr' && p.player.playbackRate !== 1.0) {
          p.player.playbackRate = 1.0;
        }
      } else if (drift > 0.4 && p.type !== 'plyr') {
        // Small drift — micro-adjust playbackRate to catch up or slow down
        setShowSyncBanner(false);
        p.player.playbackRate = guestTime < hostTime ? 1.05 : 0.95;
      } else {
        // In sync — restore normal playbackRate
        setShowSyncBanner(false);
        if (p.type !== 'plyr' && p.player.playbackRate !== 1.0) {
          p.player.playbackRate = 1.0;
        }
      }

      // Sync play state
      if (p.type === 'plyr') {
        setPlaying(hostPlaying);
        if (hostPlaying && p.player.paused) p.player.play();
        if (!hostPlaying && !p.player.paused) p.player.pause();
      } else {
        if (hostPlaying && p.player.paused) p.player.play().catch(() => {});
        if (!hostPlaying && !p.player.paused) p.player.pause();
        setPlaying(hostPlaying);
      }
    });

    // Manual re-sync response
    socket.on('sync-response', ({ currentTime: hostTime, playing: hostPlaying }: { currentTime: number; playing: boolean }) => {
      const p = getPlayer();
      if (!p) return;

      if (p.type === 'plyr') {
        p.player.currentTime = hostTime;
        if (hostPlaying) p.player.play();
        else p.player.pause();
      } else {
        p.player.currentTime = hostTime;
        if (hostPlaying) p.player.play().catch(() => {});
        else p.player.pause();
      }
      setPlaying(hostPlaying);
      setShowSyncBanner(false);
      setSyncDrift(0);
    });

    return () => {
      socket.off('sync-play');
      socket.off('sync-pause');
      socket.off('sync-seek');
      socket.off('sync-heartbeat');
      socket.off('sync-response');
    };
  }, [isHost, videoSource, isEmbedProvider]);

  // ── (3b) HOST: send periodic heartbeat every 3 seconds ──────────
  useEffect(() => {
    if (!isHost || !videoSource) return;

    const interval = setInterval(() => {
      let t = 0;
      if (isEmbedProvider && plyrRef.current) {
        t = plyrRef.current.currentTime;
      } else if (videoRef.current) {
        t = videoRef.current.currentTime ?? 0;
      }
      socket.emit('sync-heartbeat', { currentTime: t, playing });
    }, 3000);

    return () => clearInterval(interval);
  }, [isHost, videoSource, isEmbedProvider, playing]);

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
        setUsingObjectStreamState(true);
        video.removeAttribute('src');
        video.srcObject = stream;
        video.volume = volume;
        video.muted = false;
        setMuted(false);
        setVideoReady(videoTracks.length > 0);
        setAudioReady(audioTracks.length > 0);
        video.play().then(() => {
          setGuestAudioBlocked(false);
        }).catch(err => {
          console.warn('[VideoPlayer] Autoplay blocked:', err.message);
          // Fallback: play muted and show interactive unmute overlay
          video.muted = true;
          setMuted(true);
          setGuestAudioBlocked(true);
          video.play().catch(() => {});
        });
        setIsLoading(false);
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, isFile]);

  // ── (5) NATIVE VIDEO EVENT HANDLERS ─────────────────────────────
  function handleNativeTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (video.currentTime > 0) {
      setIsLoading(false);
    }
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

  function handleNativeLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    const d = video.duration;
    if (isFinite(d)) setDuration(d);
    setLoadingStatus('Buffering audio…');
  }

  function tryComposeStream() {
    if (!isHost || !isFile || streamCaptured.current) return;
    const video = videoRef.current as VideoEl | null;
    if (!video) return;

    console.log('[VideoPlayer] Composing master stream for local file…');
    composeStreamWithAudio(video).then(masterStream => {
      if (masterStream && !streamCaptured.current) {
        const aTracks = masterStream.getAudioTracks();
        const vTracks = masterStream.getVideoTracks();
        console.log('[Compositor] Master stream composed — audio:', aTracks.length, 'video:', vTracks.length);
        onLocalStream(masterStream);
        streamCaptured.current = true;
        setVideoReady(vTracks.length > 0);
        setAudioReady(aTracks.length > 0);
      }
    }).catch(err => {
      console.warn('[Compositor] Stream composition error:', err);
    });
  }

  function handleNativeLoadedData() {
    const video = videoRef.current;
    if (!video) return;

    const d = video.duration;
    if (isFinite(d)) setDuration(d);

    video.volume = volume;
    video.muted = muted;
    setVideoReady(true);
    setIsLoading(false);
    setLoadingStatus('Ready');

    console.log('[VideoPlayer] loadeddata — volume:', video.volume, 'muted:', video.muted, 'duration:', d);
    tryComposeStream();
  }

  // Capture stream on canplaythrough
  function handleNativeCanPlayThrough() {
    setIsLoading(false);
    setAudioReady(true);
    tryComposeStream();
  }

  function handleNativePlay() {
    setPlaying(true);
    setIsLoading(false);
    tryComposeStream();
  }

  function handleNativePause() { setPlaying(false); }
  function handleNativeEnded() {
    setPlaying(false);
    if (onEnded) onEnded();
  }

  function handleAudioBoostChange(e: ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    setAudioBoost(val);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = val;
    }
  }

  async function togglePiP() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('[VideoPlayer] PiP error:', err);
    }
  }
  function handleNativeWaiting() {
    const video = videoRef.current;
    if (video && video.readyState >= 3) return;
    setIsLoading(true);
    setLoadingStatus('Buffering…');
  }
  function handleNativeCanPlay() {
    setIsLoading(false);
  }

  function handleGuestFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (guestLocalFileUrl && guestLocalFileUrl.startsWith('blob:')) {
      URL.revokeObjectURL(guestLocalFileUrl);
    }
    let mediaBlob: Blob = file;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'mkv' || ext === 'avi' || ext === 'mov' || ext === 'flv' || ext === 'wmv') {
      mediaBlob = new Blob([file], { type: 'video/mp4' });
    }
    const objUrl = URL.createObjectURL(mediaBlob);
    setGuestLocalFileUrl(objUrl);
    const video = videoRef.current;
    if (video) {
      if (video.srcObject) video.srcObject = null;
      video.src = objUrl;
      video.load();
    }
  }

  function handleNativeError() {
    const video = videoRef.current;
    const errCode = video?.error?.code;
    console.error('[VideoPlayer] Native video error code:', errCode, video?.error);
    setIsLoading(false);

    if (errCode === 4) {
      setVideoError('Browser Codec Restriction: This MKV video contains AC-3/EAC-3 audio or HEVC video which Chrome/Edge restrict natively.');
    } else {
      setVideoError('Failed to decode video file. Format or codec unsupported by browser.');
    }
  }

  function handleRetryForceMP4() {
    setVideoError(null);
    setIsLoading(true);
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      setMuted(true);
      video.play().then(() => {
        setIsLoading(false);
        setPlaying(true);
      }).catch(err => {
        console.warn('[VideoPlayer] Force play failed:', err);
        setIsLoading(false);
      });
    }
  }

  // ── (6) CONTROLS ───────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (!canControl) return;

    if (isEmbedProvider && plyrRef.current) {
      const player = plyrRef.current;
      if (player.paused) {
        player.play();
        setPlaying(true);
        onPlay(player.currentTime);
      } else {
        player.pause();
        setPlaying(false);
        onPause(player.currentTime);
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
  }, [canControl, onPlay, onPause, isEmbedProvider]);

  function handleSeek(e: ChangeEvent<HTMLInputElement>) {
    if (!canControl) return;
    const t = Number(e.target.value);
    setCurrentTime(t);
    onSeek(t);

    if (isEmbedProvider && plyrRef.current) {
      plyrRef.current.currentTime = t;
    } else {
      const video = videoRef.current;
      if (video) video.currentTime = t;
    }
  }

  function handleVolumeChange(e: ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    if (isEmbedProvider && plyrRef.current) {
      plyrRef.current.volume = v;
      plyrRef.current.muted = v === 0;
    } else {
      const video = videoRef.current;
      if (video) {
        video.volume = v;
        video.muted = v === 0;
      }
    }
  }

  const toggleMute = useCallback(() => {
    setMuted((prev: boolean) => {
      const next = !prev;
      if (isEmbedProvider && plyrRef.current) {
        plyrRef.current.muted = next;
      }
      const video = videoRef.current;
      if (video) video.muted = next;
      return next;
    });
  }, [isEmbedProvider]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Manual re-sync for guest
  const handleResync = useCallback(() => {
    socket.emit('request-sync');
    setShowSyncBanner(false);
  }, []);

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
          if (!canControl) return;
          e.preventDefault();
          {
            const newTime = Math.max(0, currentTime - 10);
            setCurrentTime(newTime);
            onSeek(newTime);
            if (isEmbedProvider && plyrRef.current) {
              plyrRef.current.currentTime = newTime;
            } else {
              const video = videoRef.current;
              if (video) video.currentTime = newTime;
            }
          }
          break;
        case 'ArrowRight':
          if (!canControl) return;
          e.preventDefault();
          {
            const newTime = Math.min(duration, currentTime + 10);
            setCurrentTime(newTime);
            onSeek(newTime);
            if (isEmbedProvider && plyrRef.current) {
              plyrRef.current.currentTime = newTime;
            } else {
              const video = videoRef.current;
              if (video) video.currentTime = newTime;
            }
          }
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          setSubtitlesVisible(v => !v);
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, canControl, currentTime, duration, isEmbedProvider, onSeek]);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;
  const hasSource = !!videoSource;
  const guestWaitingForStream = !isHost && isFile && !usingObjectStreamState && !guestLocalFileUrl;

  if (showSkeleton) {
    return <VideoPlayerSkeleton />;
  }

  return (
    <div
      className={`vp-container ${ambientGlow ? 'ambient-glow' : ''} ${showControls || !playing ? 'show-controls' : 'hide-controls'}`}
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
      onTouchStart={resetHideTimer}
      tabIndex={0}
    >
      {/* Live Floating Emoji Reactions Overlay */}
      <EmojiReactions reactions={activeReactions} />
      {/* Native Video element (for Local Files + Direct URLs) */}
      {(!hasSource || !isEmbedProvider) && (
        <video
          ref={videoRef}
          className="vp-video"
          onTimeUpdate={handleNativeTimeUpdate}
          onDurationChange={handleNativeDurationChange}
          onLoadedMetadata={handleNativeLoadedMetadata}
          onLoadedData={handleNativeLoadedData}
          onCanPlayThrough={handleNativeCanPlayThrough}
          onPlay={handleNativePlay}
          onPause={handleNativePause}
          onEnded={handleNativeEnded}
          onWaiting={handleNativeWaiting}
          onCanPlay={handleNativeCanPlay}
          onError={handleNativeError}
          onClick={canControl ? togglePlay : undefined}
          playsInline
          muted={false}
        />
      )}

      {/* Plyr embed target for YouTube/Vimeo */}
      {hasSource && isEmbedProvider && (
        <div className="vp-video vp-plyr-wrapper">
          <div id="plyr-embed-target" data-plyr-provider="" data-plyr-embed-id="" />
          <div
            className="vp-iframe-overlay"
            onClick={canControl ? togglePlay : undefined}
          />
        </div>
      )}

      {/* Subtitle overlay */}
      <SubtitleOverlay
        cues={subtitleCues}
        currentTime={currentTime}
        visible={subtitlesVisible && subtitleCues.length > 0}
      />

      {/* Loading overlay with status */}
      {isLoading && hasSource && (
        <div className="vp-loading-overlay">
          <div className="vp-loading-ring">
            <svg viewBox="0 0 100 100">
              <circle className="vp-ring-bg" cx="50" cy="50" r="44" />
              <circle className="vp-ring-progress" cx="50" cy="50" r="44" />
            </svg>
          </div>
          <p className="vp-loading-text">{loadingStatus || 'Loading…'}</p>
          {(isFile || isUrl) && !isEmbedProvider && (
            <div className="vp-loading-tracks">
              <span className={`vp-track-status ${videoReady ? 'ready' : ''}`}>
                <span className="vp-track-dot" />
                Video {videoReady ? '✓' : '…'}
              </span>
              <span className={`vp-track-status ${audioReady ? 'ready' : ''}`}>
                <span className="vp-track-dot" />
                Audio {audioReady ? '✓' : '…'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error overlay */}
      {videoError && (
        <div className="vp-error-overlay animate-fade-in">
          <div className="vp-error-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#ef4444" strokeWidth="2"/>
              <path d="M20 12v10M20 26v2" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="vp-error-text">{videoError}</p>
          <div className="vp-error-actions">
            <button className="btn btn-primary btn-sm" onClick={handleRetryForceMP4}>
              ⚡ Force Muted Play
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setVideoError(null)}>
              Dismiss
            </button>
          </div>
          <div className="vp-error-tip">
            💡 <strong>5-Second Zero-Loss Container Fix:</strong><br />
            Convert <code>.mkv</code> container to <code>.mp4</code> in 5 seconds (no quality loss):<br />
            <code>ffmpeg -i input.mkv -c copy output.mp4</code>
          </div>
        </div>
      )}

      {/* Out of Sync banner for guests */}
      {showSyncBanner && !isHost && (
        <div className="vp-sync-banner animate-slide-down">
          <div className="vp-sync-banner-content">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>You're {syncDrift.toFixed(1)}s out of sync</span>
          </div>
          <button className="btn btn-primary vp-sync-btn" onClick={handleResync}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 7a5.5 5.5 0 0110.15-2.92M12.5 7A5.5 5.5 0 012.35 9.92" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M11 1v3.5h-3.5M3 13v-3.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Re-sync
          </button>
        </div>
      )}

      {/* Guest audio blocked overlay — interactive unmute prompt */}
      {guestAudioBlocked && (
        <div
          className="vp-audio-blocked-overlay animate-fade-in"
          onClick={() => {
            const video = videoRef.current;
            if (video) {
              video.muted = false;
              video.volume = volume;
              setMuted(false);
            }
            setGuestAudioBlocked(false);
            socket.emit('request-sync');
          }}
          id="vp-unmute-overlay"
        >
          <div className="vp-audio-blocked-content">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 12h4l5-4v16l-5-4h-4V12z" fill="currentColor" />
              <path d="M22 12a5 5 0 010 8M25 9a9 9 0 010 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p>Click to enable audio</p>
            <span>Browser blocked autoplay — tap anywhere to join audio</span>
          </div>
        </div>
      )}

      {/* Guest local file choice overlay */}
      {!isHost && isFile && !guestLocalFileUrl && (
        <div className="vp-guest-file-prompt animate-fade-in">
          <div className="vp-guest-prompt-box glass">
            <div className="vp-prompt-icon">🍿</div>
            <div className="vp-prompt-text">
              <h3>Host selected local file: "{videoSource?.title || 'Video File'}"</h3>
              <p>For instant 1080p/4K playback from your PC, select your local copy of this file.</p>
            </div>
            <label className="btn btn-primary vp-select-local-btn">
              📁 Select Local File Copy
              <input
                type="file"
                accept={ALLOWED_MEDIA_TYPES}
                onChange={handleGuestFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      )}

      {/* No source placeholder */}
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
        {!canControl && hasSource && !guestWaitingForStream && (
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
            <div className="vp-progress-fill" style={{ width: `${progressPercent}%` }}>
              <div className="vp-progress-thumb" />
            </div>
            <input
              type="range"
              className="vp-progress-input"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!canControl || !hasSource || duration === 0}
              aria-label="Seek"
              id="vp-seek-slider"
            />
          </div>
        </div>

        <div className="vp-bottom-bar">
          <div className="vp-left-controls">
            <button
              className="btn-icon vp-btn vp-play-btn"
              onClick={togglePlay}
              disabled={!canControl || !hasSource}
              aria-label={playing ? 'Pause' : 'Play'}
              id="vp-play-btn"
            >
              {playing ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="4" y="3" width="4" height="14" rx="1.5" fill="currentColor"/>
                  <rect x="12" y="3" width="4" height="14" rx="1.5" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 3l13 7-13 7V3z" fill="currentColor"/>
                </svg>
              )}
            </button>

            {/* Skip backward 10s */}
            <button
              className="btn-icon vp-btn"
              onClick={() => {
                if (!canControl) return;
                const t = Math.max(0, currentTime - 10);
                setCurrentTime(t);
                onSeek(t);
                if (isEmbedProvider && plyrRef.current) plyrRef.current.currentTime = t;
                else if (videoRef.current) videoRef.current.currentTime = t;
              }}
              disabled={!canControl || !hasSource}
              aria-label="Skip back 10 seconds"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3.5V1L5.5 4 9 7V4.5a5 5 0 11-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="9" y="12" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="700" fontFamily="var(--font)">10</text>
              </svg>
            </button>

            {/* Skip forward 10s */}
            <button
              className="btn-icon vp-btn"
              onClick={() => {
                if (!canControl) return;
                const t = Math.min(duration, currentTime + 10);
                setCurrentTime(t);
                onSeek(t);
                if (isEmbedProvider && plyrRef.current) plyrRef.current.currentTime = t;
                else if (videoRef.current) videoRef.current.currentTime = t;
              }}
              disabled={!canControl || !hasSource}
              aria-label="Skip forward 10 seconds"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3.5V1l3.5 3L9 7V4.5a5 5 0 115 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="9" y="12" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="700" fontFamily="var(--font)">10</text>
              </svg>
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
            {/* Audio Booster Control */}
            <div className="vp-volume-group vp-boost-group" title="Audio Booster (up to 300%)">
              <span className="vp-boost-label">⚡ {Math.round(audioBoost * 100)}%</span>
              <input
                type="range"
                className="vp-volume-slider vp-boost-slider"
                min={1}
                max={3}
                step={0.1}
                value={audioBoost}
                onChange={handleAudioBoostChange}
                aria-label="Audio Boost"
              />
            </div>

            {/* Ambient Glow Toggle */}
            <button
              className={`btn-icon vp-btn ${ambientGlow ? 'active' : ''}`}
              onClick={() => setAmbientGlow(g => !g)}
              title={ambientGlow ? 'Ambient Glow: ON' : 'Ambient Glow: OFF'}
              aria-label="Toggle Ambient Glow"
            >
              ✨
            </button>

            {/* Picture in Picture Button */}
            <button
              className="btn-icon vp-btn"
              onClick={togglePiP}
              title="Picture-in-Picture Mode"
              aria-label="Picture-in-Picture"
            >
              📺
            </button>

            {/* Subtitle CC toggle */}
            {subtitleCues.length > 0 && (
              <button
                className={`btn-icon vp-btn vp-cc-btn ${subtitlesVisible ? 'active' : ''}`}
                onClick={() => setSubtitlesVisible(v => !v)}
                aria-label={subtitlesVisible ? 'Hide subtitles' : 'Show subtitles'}
                id="vp-cc-btn"
                title={subtitlesVisible ? 'Hide subtitles (C)' : 'Show subtitles (C)'}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <text x="9" y="12" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="700" fontFamily="var(--font)">CC</text>
                </svg>
              </button>
            )}
            {/* Audio status indicator */}
            {hasSource && !isEmbedProvider && !audioReady && isHost && isFile && (
              <span className="vp-audio-status" title="Audio track loading...">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 5h2l3-3v10L4 9H2V5z" fill="currentColor" opacity=".5"/>
                  <path d="M9 5a2 2 0 010 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2"/>
                </svg>
              </span>
            )}
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
