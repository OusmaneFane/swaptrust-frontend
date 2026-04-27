import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

function socketBaseUrl(): string {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (socketUrl) return socketUrl.replace(/\/+$/, "");
  const api = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (api) return api.replace(/\/api\/v1\/?$/, "");
  // Dev fallback only
  return "http://localhost:3001";
}

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io(`${socketBaseUrl()}/chat`, {
      auth: { token },
      autoConnect: true,
      transports: ["websocket"],
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
