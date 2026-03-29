'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { UserRole } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { Spinner } from '@/components/ui/Spinner';
import { LogoutButton } from '@/components/layout/LogoutButton';

/**
 * Espace client : accès réservé aux comptes KYC validés (hors admin).
 */
export function KycGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const role = (session?.user?.role ?? 'CLIENT') as UserRole;
  const staff = role === 'ADMIN' || role === 'OPERATOR';

  const {
    data: user,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['auth', 'me', 'kyc-gate'],
    queryFn: () => authApi.me(),
    enabled: status === 'authenticated' && !staff,
    staleTime: 30_000,
    refetchInterval: (q) =>
      q.state.data?.kycStatus === 'PENDING' ? 12_000 : false,
  });

  useEffect(() => {
    if (status !== 'authenticated' || staff) return;
    if (isPending || !user) return;
    if (user.kycStatus === 'VERIFIED') {
      if (session?.user?.kycStatus !== 'VERIFIED') {
        void update({ kycStatus: 'VERIFIED' });
      }
      return;
    }
    router.replace('/kyc');
  }, [status, staff, isPending, user, session?.user?.kycStatus, update, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col bg-app">
        <header className="flex justify-end border-b border-line px-4 py-3">
          <LogoutButton label="always" />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-ink-muted">Chargement…</p>
        </div>
      </div>
    );
  }

  if (staff) return <>{children}</>;

  if (status !== 'authenticated') return <>{children}</>;

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col bg-app">
        <header className="flex justify-end border-b border-line px-4 py-3">
          <LogoutButton label="always" />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-ink-muted">Vérification du compte…</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-app">
        <header className="flex justify-end border-b border-line px-4 py-3">
          <LogoutButton label="always" />
        </header>
        <div className="mx-auto max-w-md flex-1 px-4 py-16 text-center">
          <p className="text-sm text-danger">
            Impossible de vérifier votre profil. Réessayez plus tard.
          </p>
        </div>
      </div>
    );
  }

  if (user.kycStatus !== 'VERIFIED') {
    return (
      <div className="flex min-h-screen flex-col bg-app">
        <header className="flex justify-end border-b border-line px-4 py-3">
          <LogoutButton label="always" />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-ink-muted">Redirection…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
