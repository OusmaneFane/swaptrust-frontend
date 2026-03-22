import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

function socketBaseUrl(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  return api.replace(/\/api\/v1\/?$/, '');
}

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io(`${socketBaseUrl()}/chat`, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
