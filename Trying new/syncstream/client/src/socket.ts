import { io, Socket } from 'socket.io-client';

export const getServerUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('syncstream_server_url');
    if (saved) {
      // Clean trailing slashes
      return saved.replace(/\/+$/, '');
    }
  }
  if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    if (protocol === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '') {
      return 'http://localhost:3001';
    }
    // Connected from mobile / another device on LAN (e.g. 192.168.x.x:5173)
    if (window.location.port === '5173' || window.location.port === '3000') {
      return `${protocol}//${host}:3001`;
    }
    // Connected via public tunnel or reverse proxy without dev port
    if (!window.location.port || window.location.port === '80' || window.location.port === '443') {
      return `${protocol}//${host}`;
    }
    return `${protocol}//${host}:3001`;
  }
  return 'http://localhost:3001';
};

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
