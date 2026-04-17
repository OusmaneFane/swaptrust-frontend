'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Inbox, Plus, RefreshCw } from 'lucide-react';
import { requestsApi } from '@/services/api';
import { RequestCard } from '@/components/exchange/RequestCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function MesDemandesPage() {
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['requests', 'mine'],
    queryFn: () => requestsApi.mine(),
  });

  return (
    <div className="relative min-w-0 pb-10 pt-0">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[min(16rem,38vh)] max-w-4xl rounded-[40%] bg-gradient-to-b from-primary/[0.16] via-violet-500/[0.06] to-transparent blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl space-y-5 lg:max-w-5xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
                Mes demandes
              </h1>
              {!isLoading && !isError && items.length > 0 ? (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border border-primary/15 bg-primary/[0.08] px-3 py-0.5',
                    'text-xs font-semibold tabular-nums text-primary',
                  )}
                >
                  {items.length}
                  {items.length > 1 ? ' demandes' : ' demande'}
                </span>
              ) : null}
            </div>
            <p className="max-w-xl text-xs leading-relaxed text-text-muted sm:text-sm">
              Publications en attente, prises en charge ou terminées — avec le moyen d’envoi
              sur chaque carte.
            </p>
          </div>
          <Link href="/demandes/nouvelle" className="shrink-0">
            <Button
              type="button"
              className="w-full shadow-md shadow-primary/20 sm:w-auto sm:px-6"
            >
              <Plus className="mr-2 inline h-4 w-4" strokeWidth={2.5} />
              Nouvelle demande
            </Button>
          </Link>
        </header>

        {isError ? (
          <div className="rounded-xl border border-danger/20 bg-gradient-to-br from-red-50/90 to-white p-5 text-center shadow-md shadow-red-900/[0.03] sm:p-6">
            <p className="font-medium text-danger">Impossible de charger vos demandes</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
              {error instanceof Error ? error.message : 'Erreur réseau ou serveur.'}
            </p>
            <Button
              type="button"
              className="mt-4"
              variant="outline"
              loading={isFetching}
              onClick={() => void refetch()}
            >
              <RefreshCw className="mr-2 inline h-4 w-4" />
              Réessayer
            </Button>
          </div>
        ) : isLoading ? (
          <ul className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <li key={i}>
                <Skeleton className="h-36 w-full rounded-xl" />
              </li>
            ))}
          </ul>
        ) : items.length ? (
          <ul className="grid gap-3 lg:grid-cols-2 lg:gap-3">
            {items.map((r) => (
              <li key={r.id}>
                <RequestCard request={r} showStatus href={`/demandes/${r.id}`} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-primary/25 bg-white/80 p-6 text-center shadow-inner backdrop-blur-sm sm:p-8">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-violet-500/10 text-primary">
              <Inbox className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="font-display text-base font-bold text-text-dark">
              Aucune demande pour le moment
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-text-muted sm:text-sm">
              Indiquez le montant dont vous avez besoin et le moyen d’envoi ; un opérateur
              vous guidera pour la suite.
            </p>
            <Link href="/demandes/nouvelle" className="mt-5 inline-block">
              <Button type="button" className="px-6 shadow-md shadow-primary/15">
                <Plus className="mr-2 inline h-4 w-4" strokeWidth={2.5} />
                Nouvelle demande
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
