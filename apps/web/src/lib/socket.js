import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store.js';

const url = import.meta.env.VITE_SOCKET_URL ?? '';

let socket = null;

export function getSocket() {
  if (socket) return socket;
  socket = io(url, {
    autoConnect: false,
    transports: ['websocket'],
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
  });
  return socket;
}

export function ensureSocketConnected() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
