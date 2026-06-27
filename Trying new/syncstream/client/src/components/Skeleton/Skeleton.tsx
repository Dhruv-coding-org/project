import './Skeleton.css';

interface SkeletonBoxProps {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
}

interface SkeletonTextProps {
  lines?: number;
  widths?: string[];
  className?: string;
}

interface SkeletonAvatarProps {
  size?: number;
  className?: string;
}

export function SkeletonBox({ width = '100%', height = '40px', radius, className = '' }: SkeletonBoxProps) {
  return (
    <div
      className={`skeleton skeleton-box ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

export function SkeletonText({ lines = 1, widths, className = '' }: SkeletonTextProps) {
  const defaultWidths = ['100%', '85%', '70%', '60%', '90%'];
  return (
    <div className={`skeleton-text-group ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton skeleton-text"
          style={{ width: widths?.[i] ?? defaultWidths[i % defaultWidths.length] }}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 32, className = '' }: SkeletonAvatarProps) {
  return (
    <div
      className={`skeleton skeleton-avatar ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/* ── Composite Skeletons ────────────────────────────────── */

export function LobbyCardSkeleton() {
  return (
    <div className="skeleton-lobby-card glass animate-fade-in">
      <div className="skeleton-lobby-logo">
        <SkeletonBox width="56px" height="56px" radius="12px" />
        <div>
          <SkeletonBox width="140px" height="24px" radius="8px" />
          <SkeletonBox width="180px" height="12px" radius="6px" />
        </div>
      </div>
      <SkeletonBox width="100%" height="44px" radius="12px" />
      <div className="skeleton-lobby-fields">
        <SkeletonBox width="120px" height="10px" radius="4px" />
        <SkeletonBox width="100%" height="44px" radius="12px" />
      </div>
      <SkeletonBox width="100%" height="48px" radius="12px" />
    </div>
  );
}

export function VideoPlayerSkeleton() {
  return (
    <div className="skeleton-video-player animate-fade-in">
      <div className="skeleton-video-screen skeleton" />
      <div className="skeleton-video-controls">
        <SkeletonBox width="100%" height="4px" radius="99px" />
        <div className="skeleton-video-bar">
          <div className="skeleton-video-bar-left">
            <SkeletonBox width="32px" height="32px" radius="8px" />
            <SkeletonBox width="32px" height="32px" radius="8px" />
            <SkeletonBox width="60px" height="4px" radius="99px" />
            <SkeletonBox width="80px" height="12px" radius="6px" />
          </div>
          <SkeletonBox width="32px" height="32px" radius="8px" />
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="skeleton-chat animate-fade-in">
      <div className="skeleton-chat-header">
        <SkeletonBox width="14px" height="14px" radius="4px" />
        <SkeletonBox width="40px" height="10px" radius="4px" />
      </div>
      <div className="skeleton-chat-messages">
        {/* Incoming message */}
        <div className="skeleton-chat-msg incoming">
          <SkeletonBox width="60px" height="8px" radius="4px" />
          <SkeletonBox width="180px" height="36px" radius="14px" />
        </div>
        {/* Outgoing message */}
        <div className="skeleton-chat-msg outgoing">
          <SkeletonBox width="140px" height="36px" radius="14px" />
        </div>
        {/* Incoming message */}
        <div className="skeleton-chat-msg incoming">
          <SkeletonBox width="50px" height="8px" radius="4px" />
          <SkeletonBox width="200px" height="36px" radius="14px" />
        </div>
      </div>
      <div className="skeleton-chat-input">
        <SkeletonBox width="100%" height="38px" radius="12px" />
        <SkeletonBox width="38px" height="38px" radius="12px" />
      </div>
    </div>
  );
}

export function UserListSkeleton() {
  return (
    <div className="skeleton-userlist animate-fade-in">
      <div className="skeleton-userlist-header">
        <div>
          <SkeletonBox width="70px" height="8px" radius="4px" />
          <SkeletonBox width="100px" height="16px" radius="6px" />
        </div>
        <SkeletonBox width="70px" height="30px" radius="8px" />
      </div>
      <div className="skeleton-userlist-title">
        <SkeletonBox width="60px" height="8px" radius="4px" />
        <SkeletonBox width="36px" height="18px" radius="99px" />
      </div>
      <div className="skeleton-userlist-items">
        {[0, 1, 2].map(i => (
          <div key={i} className="skeleton-userlist-item" style={{ animationDelay: `${i * 0.08}s` }}>
            <SkeletonAvatar size={32} />
            <SkeletonBox width={`${100 - i * 15}px`} height="12px" radius="6px" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RoomSkeleton() {
  return (
    <div className="skeleton-room animate-fade-in">
      {/* Header skeleton */}
      <div className="skeleton-room-header">
        <div className="skeleton-room-header-left">
          <SkeletonBox width="32px" height="32px" radius="8px" />
          <SkeletonBox width="90px" height="14px" radius="6px" />
        </div>
        <div className="skeleton-room-header-center">
          <SkeletonBox width="120px" height="28px" radius="8px" />
          <SkeletonBox width="1px" height="20px" />
          <SkeletonBox width="50px" height="18px" radius="99px" />
        </div>
        <div className="skeleton-room-header-right">
          <SkeletonBox width="100px" height="32px" radius="8px" />
          <SkeletonBox width="80px" height="32px" radius="8px" />
        </div>
      </div>
      {/* Body skeleton */}
      <div className="skeleton-room-body">
        <div className="skeleton-room-main">
          <VideoPlayerSkeleton />
        </div>
        <div className="skeleton-room-sidebar glass">
          <UserListSkeleton />
          <ChatSkeleton />
        </div>
      </div>
    </div>
  );
}

export function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-orb splash-orb-1" />
      <div className="splash-orb splash-orb-2" />
      <div className="splash-content animate-scale-spring">
        <div className="splash-logo-icon">
          <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="url(#splash-g)" strokeWidth="2"/>
            <path d="M10 9.5L20 14L10 18.5V9.5Z" fill="url(#splash-g)"/>
            <defs>
              <linearGradient id="splash-g" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7c3aed"/><stop offset="1" stopColor="#a855f7"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="splash-name">SyncStream</h1>
        <div className="splash-loader">
          <div className="splash-loader-bar" />
        </div>
        <p className="splash-subtitle">Preparing your experience…</p>
      </div>
    </div>
  );
}
