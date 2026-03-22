'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Star } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useQuery } from '@tanstack/react-query';
import { authApi, usersApi } from '@/services/api';
import { fullDate } from '@/lib/utils';
import type { Review } from '@/types';
import { LogoutButton } from '@/components/layout/LogoutButton';

export default function ProfilPage() {
  const { data: session } = useSession();
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
  });

  const numericId = me?.id ?? Number.NaN;

  const { data: reviews = [], isLoading: revLoading } = useQuery({
    queryKey: ['reviews', 'user', numericId],
    queryFn: () => usersApi.getReviews(numericId),
    enabled: Number.isFinite(numericId),
  });

  const loading = meLoading;

  return (
    <div className="mx-auto max-w-lg space-y-6 lg:max-w-xl">
      <div className="flex flex-col items-center text-center">
        <Avatar
          src={me?.avatar ?? null}
          name={me?.name ?? session?.user?.name ?? '?'}
          size="lg"
        />
        <h1 className="mt-4 font-display text-2xl font-bold">
          {me?.name ?? session?.user?.name}
        </h1>
        <p className="text-sm text-ink-muted">{me?.email ?? session?.user?.email}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Badge tone="muted">{me?.kycStatus ?? 'KYC'}</Badge>
        </div>
      </div>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-muted">Note moyenne</p>
          <p className="flex items-center gap-1 font-display text-2xl font-bold">
            <Star className="h-6 w-6 text-warning" fill="currentColor" />
            {me?.ratingAvg != null ? me.ratingAvg.toFixed(1) : '—'} / 5
          </p>
        </div>
        <div className="text-right text-sm text-ink-muted">
          <p>Échanges : {me?.transactionsCount ?? '—'}</p>
          <p>
            Membre depuis :{' '}
            {me?.createdAt ? fullDate(me.createdAt) : '—'}
          </p>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Derniers avis</h2>
        {loading || revLoading ? (
          <Skeleton className="h-24 w-full rounded-card" />
        ) : reviews.length ? (
          <ul className="space-y-2">
            {reviews.map((r: Review) => (
              <li key={r.id} className="glass-card p-3 text-sm">
                <p className="font-medium">{r.author.name}</p>
                <p className="text-ink-secondary">{r.comment}</p>
                <p className="mt-1 text-xs text-ink-faint">
                  {fullDate(r.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Aucun avis pour l’instant.</p>
        )}
      </div>

      <Link
        href="/profil/modifier"
        className="block w-full rounded-pill border border-line py-3 text-center text-sm font-semibold hover:bg-surface-hover"
      >
        Modifier le profil
      </Link>

      <LogoutButton
        className="w-full justify-center rounded-pill border border-line py-3 hover:border-danger/30"
        label="always"
      />
    </div>
  );
}
