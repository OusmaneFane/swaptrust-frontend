'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { operatorApi } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCFA, formatRUB, fromNow } from '@/lib/utils';
import { TRANSACTION_STEPS } from '@/types/transaction';
import { UrgencyBadge } from '@/components/operator/UrgencyBadge';
import { TakeRequestModal } from '@/components/operator/TakeRequestModal';
import type { ExchangeRequest } from '@/types';

const MAX_CONCURRENT = 5;

export default function OperateurDashboardPage() {
  const [takeRequest, setTakeRequest] = useState<ExchangeRequest | null>(null);

  const { data: pending = [], isLoading: loadPending } = useQuery({
    queryKey: ['operator', 'requests'],
    queryFn: () => operatorApi.getPendingRequests(),
    refetchInterval: 30_000,
  });

  const { data: myTx = [], isLoading: loadTx } = useQuery({
    queryKey: ['operator', 'transactions'],
    queryFn: () => operatorApi.getMyTransactions(),
    refetchInterval: 15_000,
  });

  const sortedPending = [...pending].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const openTx = myTx.filter(
    (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED',
  );
  const atLimit = openTx.length >= MAX_CONCURRENT;

  function statusSummary(status: string): string {
    switch (status) {
      case 'INITIATED':
        return 'En attente du reçu client';
      case 'CLIENT_SENT':
        return 'Reçu client à vérifier';
      case 'OPERATOR_VERIFIED':
        return 'Reçu validé — à envoyer';
      case 'OPERATOR_SENT':
        return 'En attente confirmation client';
      default:
        return TRANSACTION_STEPS[status as keyof typeof TRANSACTION_STEPS]?.label ?? status;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">
          Demandes & transactions
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Prenez en charge les demandes clients et suivez vos échanges.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {loadPending ? (
          <>
            <Skeleton className="h-24 rounded-card" />
            <Skeleton className="h-24 rounded-card" />
          </>
        ) : (
          <>
            <Card className="border-line/90 p-4 shadow-card">
              <p className="font-display text-2xl font-bold text-ink">
                {pending.length}
              </p>
              <p className="text-sm text-ink-muted">Demandes en attente</p>
            </Card>
            <Card className="border-primary/20 bg-primary/[0.06] p-4 shadow-card">
              <p className="font-display text-2xl font-bold text-primary">
                {openTx.length}
              </p>
              <p className="text-sm text-ink-muted">Transactions en cours</p>
              {atLimit ? (
                <p className="mt-2 text-xs text-warning">
                  Limite de {MAX_CONCURRENT} transactions simultanées atteinte.
                </p>
              ) : null}
            </Card>
          </>
        )}
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          Nouvelles demandes
        </h2>
        {loadPending ? (
          <Skeleton className="h-32 w-full rounded-card" />
        ) : sortedPending.length ? (
          <ul className="space-y-2">
            {sortedPending.map((r) => (
              <li key={r.id}>
                <Card className="flex flex-col gap-3 p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{r.client.name}</p>
                      <span className="text-xs text-ink-faint">
                        {fromNow(r.createdAt)}
                      </span>
                      <UrgencyBadge expiresAt={r.expiresAt} />
                    </div>
                    <p className="mt-1 text-sm text-ink-secondary">
                      {r.type === 'NEED_RUB'
                        ? `Besoin de ${formatRUB(r.amountWanted)} → enverra ${formatCFA(r.amountToSend)}`
                        : `Besoin de ${formatCFA(r.amountWanted)} → enverra ${formatRUB(r.amountToSend)}`}
                    </p>
                    {r.note ? (
                      <p className="mt-1 text-xs italic text-ink-faint">« {r.note} »</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    className="shrink-0"
                    disabled={atLimit}
                    onClick={() => setTakeRequest(r)}
                  >
                    {atLimit ? 'Limite atteinte' : 'Prendre en charge'}
                    <ArrowRight className="ml-1 inline h-4 w-4" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="border-dashed p-6 text-center text-sm text-ink-muted">
            Aucune demande en attente.
          </Card>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">
            Mes transactions en cours
          </h2>
          <Link
            href="/operateur/transactions"
            className="text-sm font-medium text-primary hover:underline"
          >
            Tout voir
          </Link>
        </div>
        {loadTx ? (
          <Skeleton className="h-28 w-full rounded-card" />
        ) : openTx.length ? (
          <ul className="space-y-2">
            {openTx.slice(0, 10).map((t) => {
              const step = TRANSACTION_STEPS[t.status];
              const stepLabel =
                step.step > 0 ? `#${t.id} ${t.client.name} — ${statusSummary(t.status)}` : `#${t.id}`;
              return (
                <li key={t.id}>
                  <Link
                    href={`/operateur/transactions/${t.id}`}
                    className="glass-card flex flex-wrap items-center justify-between gap-2 p-4 text-sm hover:border-primary/30"
                  >
                    <div>
                      <p className="font-medium text-ink">{stepLabel}</p>
                      <p className="text-ink-muted">
                        {formatCFA(t.amountCfa)} · {formatRUB(t.amountRub)}
                      </p>
                      <p className="text-xs text-ink-faint">
                        {t.takenAt ? fromNow(t.takenAt) : '—'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Aucune transaction ouverte.</p>
        )}
      </section>

      <Modal
        open={takeRequest != null}
        onClose={() => setTakeRequest(null)}
        title="Prendre en charge"
      >
        {takeRequest ? (
          <TakeRequestModal request={takeRequest} onClose={() => setTakeRequest(null)} />
        ) : null}
      </Modal>
    </div>
  );
}
