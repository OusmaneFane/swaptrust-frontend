'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { UserRole } from '@/types/user';
import { Skeleton } from '@/components/ui/Skeleton';

function isStaff(role: UserRole | undefined): boolean {
  return role === 'ADMIN' || role === 'OPERATOR';
}

export function OperatorGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const ok = isStaff(role);

  useEffect(() => {
    if (status === 'loading') return;
    if (!ok) {
      router.replace('/tableau-de-bord');
    }
  }, [ok, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen space-y-4 bg-app p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full max-w-3xl rounded-card" />
      </div>
    );
  }

  if (!ok) return null;

  return <>{children}</>;
}
