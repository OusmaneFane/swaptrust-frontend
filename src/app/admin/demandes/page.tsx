'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock, Flame, Inbox, RefreshCw, Search } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { TakeRequestModal } from '@/components/operator/TakeRequestModal';
import { UrgencyBadge } from '@/components/operator/UrgencyBadge';
import { formatCFA, formatRUB, fromNow } from '@/lib/utils';
import type { ExchangeRequest } from '@/types';

type SortMode = 'oldest' | 'newest';

function minutesLeft(expiresAt: string): number {
  return Math.floor((new Date(expiresAt).getTime() - Date.now()) / 60_000);
}

export default function AdminDemandesPage() {
  const [takeRequest, setTakeRequest] = useState<ExchangeRequest | null>(null);
  const [q, setQ] = useState('');
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('oldest');

  const { data: pending = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admin', 'demandes', 'pending'],
    queryFn: () => adminApi.pendingRequests(),
    refetchInterval: 30_000,
  });

  const query = q.trim().toLowerCase();
  const urgent = pending.filter((r) => minutesLeft(r.expiresAt) <= 20);
  const critical = pending.filter((r) => minutesLeft(r.expiresAt) <= 10);

  const filtered = pending.filter((r) => {
    if (onlyUrgent && minutesLeft(r.expiresAt) > 20) return false;
    if (!query) return true;
    const hay = `${r.client?.name ?? ''} ${r.note ?? ''} ${r.id}`.toLowerCase();
    return hay.includes(query);
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    return sortMode === 'oldest' ? da - db : db - da;
  });

  const oldestCreatedAt =
    pending.length > 0
      ? pending
          .map((r) => new Date(r.createdAt).getTime())
          .filter((t) => Number.isFinite(t))
          .sort((a, b) => a - b)[0]
      : null;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-card border border-primary/10 bg-white p-6 shadow-card-lg">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <p className="text-xs text-text-muted">
            <Link href="/admin" className="text-primary hover:underline">
              ← Tableau de bord
            </Link>
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Inbox className="h-5 w-5" aria-hidden />
                </span>
                <h1 className="font-display text-3xl font-bold tracking-tight text-text-dark">
                  Demandes à traiter
                </h1>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                Prenez en charge une demande pour créer/ouvrir la transaction côté opérateur.
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Source: <span className="font-mono">GET /admin/requests/pending</span> · Action:{' '}
                <span className="font-mono">POST /operator/requests/:id/take</span>
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                variant="outline"
                className="w-full gap-2 sm:w-auto"
                onClick={() => void refetch()}
                disabled={isLoading || isRefetching}
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                {isRefetching ? 'Actualisation…' : 'Actualiser'}
              </Button>
              <Link href="/operateur" className="inline-flex w-full sm:w-auto">
                <Button className="w-full gap-2 sm:w-auto">
                  Vue opérateur
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Card className="border border-primary/10 bg-white/80 p-4 shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    En attente
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-text-dark tabular-nums">
                    {isLoading ? '—' : pending.length}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Mise à jour auto toutes les 30s</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Inbox className="h-5 w-5" aria-hidden />
                </span>
              </div>
            </Card>

            <Card className="border border-warning/20 bg-white/80 p-4 shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Urgentes (≤ 20 min)
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-text-dark tabular-nums">
                    {isLoading ? '—' : urgent.length}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Critiques (≤ 10 min):{' '}
                    <span className="font-semibold text-danger">{isLoading ? '—' : critical.length}</span>
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-warning/10 text-warning ring-1 ring-warning/20">
                  <Flame className="h-5 w-5" aria-hidden />
                </span>
              </div>
            </Card>

            <Card className="border border-primary/10 bg-white/80 p-4 shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Plus ancienne
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-text-dark">
                    {isLoading || oldestCreatedAt == null ? '—' : fromNow(new Date(oldestCreatedAt).toISOString())}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Âge depuis création</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Clock className="h-5 w-5" aria-hidden />
                </span>
              </div>
            </Card>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher (nom, note, id)…"
                className="input-field w-full pl-9"
              />
            </div>

            <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2 sm:items-center">
              <Button
                variant={onlyUrgent ? 'primary' : 'outline'}
                className="w-full gap-2"
                onClick={() => setOnlyUrgent((v) => !v)}
              >
                <Flame className="h-4 w-4" aria-hidden />
                Urgentes
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() =>
                  setSortMode((s) => (s === 'oldest' ? 'newest' : 'oldest'))
                }
              >
                Trier: {sortMode === 'oldest' ? 'Anciennes' : 'Récentes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-text-dark">
            Liste ({sorted.length})
          </h2>
          <p className="text-xs text-text-muted">
            {query ? (
              <>
                Filtre: <span className="font-mono">{q.trim()}</span>
              </>
            ) : (
              'Cliquez sur “Prendre en charge” pour continuer le flux opérateur.'
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            <Skeleton className="h-24 w-full rounded-card" />
            <Skeleton className="h-24 w-full rounded-card" />
            <Skeleton className="h-24 w-full rounded-card" />
          </div>
        ) : sorted.length ? (
          <ul className="space-y-2">
            {sorted.map((r) => (
              <li key={r.id}>
                <Card className="group flex flex-col gap-3 border border-primary/10 bg-white/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display font-semibold text-text-dark">
                        {r.client.name}
                      </p>
                      <span className="text-xs text-text-muted">
                        #{r.id} · {fromNow(r.createdAt)}
                      </span>
                      <UrgencyBadge expiresAt={r.expiresAt} />
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {r.type === 'NEED_RUB'
                        ? `Besoin de ${formatRUB(r.amountWanted)} → enverra ${formatCFA(r.amountToSend)}`
                        : `Besoin de ${formatCFA(r.amountWanted)} → enverra ${formatRUB(r.amountToSend)}`}
                    </p>
                    {r.note ? (
                      <p className="mt-1 text-xs italic text-text-muted">« {r.note} »</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    className="w-full shrink-0 gap-1 sm:w-auto"
                    onClick={() => setTakeRequest(r)}
                  >
                    Prendre en charge
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-card border border-dashed border-primary/15 bg-white/80 p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Inbox className="h-6 w-6" aria-hidden />
            </div>
            <p className="mt-4 font-display text-lg font-semibold text-text-dark">
              Rien à traiter pour l’instant
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Les nouvelles demandes apparaîtront ici automatiquement.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => void refetch()}
              >
                Actualiser
              </Button>
              <Link href="/admin/platform-accounts" className="inline-flex w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Comptes DoniSend</Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      <Modal
        open={takeRequest != null}
        onClose={() => setTakeRequest(null)}
        title="Prendre en charge (admin)"
      >
        {takeRequest ? (
          <TakeRequestModal request={takeRequest} onClose={() => setTakeRequest(null)} />
        ) : null}
      </Modal>
    </div>
  );
}
