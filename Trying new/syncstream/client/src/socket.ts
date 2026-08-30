import { io, Socket } from 'socket.io-client';

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

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const protocol = window.location.protocol;

    // Local / Desktop App / Electron
    if (protocol === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '') {
      return 'http://localhost:3001';
    }

    // Connected from mobile / another device on LAN (e.g. 192.168.x.x:5173)
    if (window.location.port === '5173' || window.location.port === '3000') {
      return `${protocol}//${host}:3001`;
    }

    // Vercel / Netlify / Cloudflare Pages frontend hosting (static CDN)
    if (host.includes('vercel.app') || host.includes('netlify.app') || host.includes('pages.dev')) {
      return localStorage.getItem('syncstream_server_url') || 'http://localhost:3001';
    }

    // Public reverse proxy or tunnel (localtunnel, ngrok, custom domain)
    if (!window.location.port || window.location.port === '80' || window.location.port === '443') {
      return `${protocol}//${host}`;
    }

    return `${protocol}//${host}:3001`;
  }

  return 'http://localhost:3001';
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
