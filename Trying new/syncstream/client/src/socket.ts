import { io, Socket } from 'socket.io-client';

export const CLOUD_SERVER_URL = 'https://sync-stream-ag16.onrender.com';
export const LOCAL_SERVER_URL = 'http://localhost:3001';

export const getServerUrl = (): string => {
  if (typeof window !== 'undefined') {
    // 1. URL Query Parameter override (?server=https://...)
    try {
      const params = new URLSearchParams(window.location.search);
      const queryServer = params.get('server');
      if (queryServer) {
        const clean = queryServer.replace(/\/+$/, '');
        localStorage.setItem('syncstream_server_url', clean);
        return clean;
      }
    } catch (e) {
      console.debug('Failed to parse server param:', e);
    }

    // 2. Saved user preference in localStorage
    const saved = localStorage.getItem('syncstream_server_url');
    if (saved) {
      return saved.replace(/\/+$/, '');
    }

    // 3. Electron Desktop App or Localhost -> Always use local backend on port 3001
    const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isElectron || isLocalhost) {
      return LOCAL_SERVER_URL;
    }
  }

  // 4. Vite environment variable (e.g. deployed with VITE_SERVER_URL on Vercel)
  if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL;

  // 5. Default to shared Cloud Server for external web visitors
  return CLOUD_SERVER_URL;
};

export function setCustomServerUrl(url: string) {
  if (typeof window !== 'undefined') {
    const clean = url.trim().replace(/\/+$/, '');
    if (clean) {
      localStorage.setItem('syncstream_server_url', clean);
    } else {
      localStorage.removeItem('syncstream_server_url');
    }
    // Reconnect socket with new URL
    socket.disconnect();
    (socket.io as unknown as { uri: string }).uri = getServerUrl();
    socket.connect();
  }
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  // If URL already points to local server (e.g. from Electron dialog or local backend), keep it local
  if (url.startsWith('http://localhost:3001') || url.startsWith('http://127.0.0.1:3001')) {
    return url;
  }

  if (url.startsWith('/api/stream')) {
    return `${getServerUrl()}${url}`;
  }
  if (url.includes('/api/stream')) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return url;
      }
      return `${getServerUrl()}${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }
  return url;
}

export const socket: Socket = io(getServerUrl(), {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 10000,
});
