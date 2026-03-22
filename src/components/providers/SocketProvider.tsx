'use client';

import { useSession } from 'next-auth/react';
import { useEffect, type ReactNode } from 'react';
import { disconnectSocket, getSocket } from '@/lib/socket';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }
    getSocket(token);
    return () => {
      disconnectSocket();
    };
  }, [token]);

  return <>{children}</>;
}
