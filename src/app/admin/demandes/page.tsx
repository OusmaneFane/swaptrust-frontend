'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { TakeRequestModal } from '@/components/operator/TakeRequestModal';
import { UrgencyBadge } from '@/components/operator/UrgencyBadge';
import { formatCFA, formatRUB, fromNow } from '@/lib/utils';
import type { ExchangeRequest } from '@/types';

export default function AdminDemandesPage() {
  const [takeRequest, setTakeRequest] = useState<ExchangeRequest | null>(null);

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['admin', 'demandes', 'pending'],
    queryFn: () => adminApi.pendingRequests(),
    refetchInterval: 30_000,
  });

  const sorted = [...pending].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-text-muted">
          <Link href="/admin" className="text-primary hover:underline">
            ← Tableau de bord
          </Link>
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-text-dark">
          Demandes à traiter
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Après « Prendre en charge », redirection vers{' '}
          <code className="rounded bg-white px-1 font-mono text-[11px] text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
            /operateur/transactions/:id
          </code>{' '}
          — accessible aux comptes <strong className="text-text-dark">ADMIN</strong>{' '}
          (menu <strong className="text-text-dark">Espace opérateur</strong> dans la
          barre latérale).
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Liste des demandes en attente d’opérateur (
          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
            GET /admin/requests/pending
          </code>
          ). La prise en charge utilise la même route que l’espace opérateur (
          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
            POST /operator/requests/:id/take
          </code>
          ) — le compte admin doit y être autorisé côté API, ou posséder aussi le rôle opérateur.
        </p>
      </div>

      <Card className="border border-primary/10 bg-white/80 p-4 text-sm text-text-secondary shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur">
        <p>
          Après prise en charge, vous êtes redirigé vers la{' '}
          <strong className="text-text-dark">fiche transaction opérateur</strong> pour
          suivre l’échange (reçu client, envoi des fonds, etc.). Les clients paient
          sur les{' '}
          <Link href="/admin/platform-accounts" className="font-medium text-primary underline">
            comptes DoniSend
          </Link>
          .
        </p>
      </Card>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-text-dark">
            En attente ({pending.length})
          </h2>
          <Link
            href="/operateur"
            className="text-sm font-medium text-primary hover:underline"
          >
            Vue opérateur complète →
          </Link>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-card" />
        ) : sorted.length ? (
          <ul className="space-y-2">
            {sorted.map((r) => (
              <li key={r.id}>
                <Card className="flex flex-col gap-3 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-text-dark">{r.client.name}</p>
                      <span className="text-xs text-text-muted">{fromNow(r.createdAt)}</span>
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
                    className="shrink-0 gap-1"
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
          <Card className="border border-dashed border-primary/15 p-8 text-center text-sm text-text-muted shadow-sm">
            Aucune demande en attente.
          </Card>
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
