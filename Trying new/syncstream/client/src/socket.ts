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
  }

  // 3. Vite environment variable (e.g. deployed with VITE_SERVER_URL on Vercel)
  if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL;

  // 4. Default to shared Cloud Server so Desktop App and Website sync seamlessly
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
  if (url.startsWith('/api/stream')) {
    return `${getServerUrl()}${url}`;
  }
  if (url.includes('/api/stream')) {
    try {
      const parsed = new URL(url);
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
