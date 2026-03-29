'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAdmin) {
      router.replace('/tableau-de-bord');
    }
  }, [isAdmin, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen space-y-4 bg-app p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full max-w-3xl rounded-card" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
