'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { UserRole } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/services/api';

export function KycGate({ children }: { children: React.ReactNode }) {
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
    if (session?.user?.kycStatus !== 'VERIFIED') {
      void update({ kycStatus: 'VERIFIED' });
    }
  }, [status, staff, isPending, user, session?.user?.kycStatus, update]);

  return <>{children}</>;
}
