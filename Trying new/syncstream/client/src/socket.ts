import { io } from 'socket.io-client';

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
    if (protocol === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '') return 'http://localhost:3001';
  }
  return 'http://localhost:3001';
};

export const socket: any = io(getServerUrl(), {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 10000,
});
