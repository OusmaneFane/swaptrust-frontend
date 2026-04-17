'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ChevronRight,
  Inbox,
  PencilLine,
  Star,
  UserRound,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useQuery } from '@tanstack/react-query';
import { authApi, usersApi } from '@/services/api';
import { cn, fullDate } from '@/lib/utils';
import type { KycStatus, Review } from '@/types';
import { LogoutButton } from '@/components/layout/LogoutButton';

function kycBadgeTone(
  s: KycStatus | undefined,
): 'muted' | 'warning' | 'success' | 'danger' {
  switch (s) {
    case 'VERIFIED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    default:
      return 'muted';
  }
}

function kycLabel(s: KycStatus | undefined): string {
  switch (s) {
    case 'VERIFIED':
      return 'Identité vérifiée';
    case 'PENDING':
      return 'Vérification en cours';
    case 'REJECTED':
      return 'Vérification refusée';
    case 'NOT_SUBMITTED':
      return 'Identité non soumise';
    default:
      return 'KYC';
  }
}

function StarsRow({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < rating
              ? 'fill-amber-400 text-amber-500'
              : 'fill-slate-100 text-slate-200',
          )}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </span>
  );
}

const shell =
  'relative mx-auto min-w-0 max-w-lg pb-10 pt-0 xl:max-w-2xl';
const halo =
  'pointer-events-none absolute inset-x-0 top-0 mx-auto h-[min(16rem,36vh)] max-w-xl rounded-[40%] bg-gradient-to-b from-primary/[0.16] via-violet-500/[0.06] to-transparent blur-3xl';
const surfaceCard =
  'rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur-sm';

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

  const listLoading = meLoading || (Number.isFinite(numericId) && revLoading);

  return (
    <div className={shell}>
      <div className={halo} aria-hidden />

      <div className="relative space-y-4">
        <div
          className={cn(
            surfaceCard,
            'overflow-hidden px-5 pb-6 pt-8 text-center sm:px-8',
          )}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            {meLoading ? (
              <div className="flex flex-col items-center">
                <Skeleton className="h-24 w-24 rounded-full ring-4 ring-white" />
                <Skeleton className="mt-5 h-8 w-48 rounded-lg" />
                <Skeleton className="mt-2 h-4 w-64 max-w-full rounded-lg" />
                <Skeleton className="mt-4 h-7 w-40 rounded-full" />
              </div>
            ) : (
              <>
                <div className="relative mx-auto w-fit">
                  <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/35 via-accent/20 to-violet-400/25 blur-md" />
                  <Avatar
                    src={me?.avatar ?? null}
                    name={me?.name ?? session?.user?.name ?? '?'}
                    size="lg"
                    className="relative ring-4 ring-white shadow-lg"
                  />
                </div>
                <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
                  {me?.name ?? session?.user?.name}
                </h1>
                <p className="mt-1 text-sm text-text-muted sm:text-base">
                  {me?.email ?? session?.user?.email}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Badge
                    tone={kycBadgeTone(me?.kycStatus)}
                    className="text-[10px] sm:text-xs"
                  >
                    {kycLabel(me?.kycStatus)}
                  </Badge>
                  {me?.role === 'CLIENT' ? (
                    <span className="rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      Client
                    </span>
                  ) : null}
                  {me?.role === 'OPERATOR' ? (
                    <span className="rounded-full border border-primary/15 bg-primary/[0.07] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Opérateur
                    </span>
                  ) : null}
                  {me?.role === 'ADMIN' ? (
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                      Admin
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className={cn(
            surfaceCard,
            'grid gap-4 p-4 sm:grid-cols-2 sm:items-center sm:p-5',
          )}
        >
          <div className="rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70">
              Note moyenne
            </p>
            <p className="mt-1 flex items-center gap-2 font-display text-3xl font-bold tabular-nums text-text-dark">
              <Star
                className="h-7 w-7 fill-amber-400 text-amber-500"
                strokeWidth={1.5}
                aria-hidden
              />
              {meLoading ? (
                <Skeleton className="inline-block h-9 w-16 rounded-md" />
              ) : me?.ratingAvg != null ? (
                <>
                  {me.ratingAvg.toFixed(1)}
                  <span className="text-lg font-semibold text-text-muted">/5</span>
                </>
              ) : (
                '—'
              )}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
              <span className="text-text-muted">Échanges</span>
              <span className="font-bold tabular-nums text-text-dark">
                {meLoading ? '…' : (me?.transactionsCount ?? '—')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
              <span className="text-text-muted">Membre depuis</span>
              <span className="text-right text-xs font-semibold text-text-dark">
                {meLoading
                  ? '…'
                  : me?.createdAt
                    ? fullDate(me.createdAt)
                    : '—'}
              </span>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center gap-2.5">
            <span
              className="h-7 w-1 shrink-0 rounded-full bg-gradient-to-b from-primary to-accent"
              aria-hidden
            />
            <h2 className="font-display text-base font-bold text-text-dark sm:text-lg">
              Derniers avis
            </h2>
          </div>

          {listLoading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : reviews.length ? (
            <ul className="space-y-2.5">
              {reviews.map((r: Review) => (
                <li
                  key={r.id}
                  className={cn(
                    surfaceCard,
                    'p-4 transition hover:border-primary/20 hover:shadow-md',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-text-dark">{r.author.name}</p>
                    <StarsRow rating={r.rating} />
                  </div>
                  {r.comment ? (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {r.comment}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm italic text-text-muted">
                      Sans commentaire
                    </p>
                  )}
                  <p className="mt-2 text-[11px] font-medium text-slate-500">
                    {fullDate(r.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div
              className={cn(
                surfaceCard,
                'border-dashed py-10 text-center',
              )}
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Inbox className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="text-sm font-semibold text-text-dark">
                Aucun avis pour l’instant
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-text-muted">
                Les retours des opérateurs ou clients apparaîtront ici.
              </p>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
          <Link
            href="/profil/modifier"
            className={cn(
              'btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold shadow-md shadow-primary/20',
            )}
          >
            <PencilLine className="h-4 w-4" strokeWidth={2} />
            Modifier le profil
            <ChevronRight className="h-4 w-4 opacity-80" strokeWidth={2.5} />
          </Link>
        </div>

        <LogoutButton
          className={cn(
            'w-full justify-center rounded-xl border border-slate-200/90 bg-white py-3 text-sm font-semibold text-text-dark shadow-sm ring-1 ring-slate-900/[0.04] transition',
            'hover:border-danger/25 hover:bg-red-50/50 hover:text-danger',
          )}
          label="always"
        />

        <p className="text-center text-[11px] text-text-muted">
          <UserRound className="mr-1 inline h-3 w-3 align-text-bottom opacity-70" />
          Compte sécurisé — déconnexion ci-dessus met fin à la session sur cet appareil.
        </p>
      </div>
    </div>
  );
}
