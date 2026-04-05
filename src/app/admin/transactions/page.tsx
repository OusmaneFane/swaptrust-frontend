'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { adminApi } from '@/services/api';
import type { Transaction } from '@/types';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatCFA, formatRUB, fullDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const statusTone: Record<string, string> = {
  INITIATED: 'text-ink-muted',
  CLIENT_SENT: 'text-sky-600',
  OPERATOR_VERIFIED: 'text-primary-dark',
  OPERATOR_SENT: 'text-violet-600',
  COMPLETED: 'text-success',
  DISPUTED: 'text-danger animate-pulse',
  CANCELLED: 'text-danger/80',
};

export default function AdminTransactionsPage() {
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState<Transaction | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'transactions', status],
    queryFn: () => adminApi.transactions(status ? { status } : undefined),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-primary/20 bg-gradient-to-r from-primary/8 to-accent/5 px-5 py-4 text-sm text-ink-secondary shadow-sm">
        <strong className="font-semibold text-ink">Surveillance passive.</strong>{' '}
        Suivi des échanges opérateur ↔ client. Cette vue correspond à{' '}
        <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs text-ink-secondary shadow-sm">
          GET /admin/transactions
        </code>{' '}
        (lecture seule).
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Transactions
        </h1>
        <select
          className="rounded-input border border-line bg-card px-4 py-2.5 text-sm font-medium text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tous statuts</option>
          <option value="INITIATED">Initié</option>
          <option value="CLIENT_SENT">Reçu client</option>
          <option value="OPERATOR_VERIFIED">Reçu validé</option>
          <option value="OPERATOR_SENT">Envoyé par opérateur</option>
          <option value="COMPLETED">Terminé</option>
          <option value="DISPUTED">Litige</option>
          <option value="CANCELLED">Annulé</option>
        </select>
      </div>
      <Card className="overflow-hidden border-line/90 p-0 shadow-card-lg">
        {isLoading ? (
          <Skeleton className="m-4 h-48 rounded-card" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line bg-surface/80 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Opérateur</th>
                  <th className="p-4 font-medium">CFA</th>
                  <th className="p-4 font-medium">RUB</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Pilotage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-card">
                {rows.map((t: Transaction) => (
                  <tr
                    key={t.id}
                    className="cursor-pointer transition-colors hover:bg-surface-hover/80"
                    onClick={() => setDetail(t)}
                  >
                    <td className="p-4 font-semibold text-ink">#{t.id}</td>
                    <td className="p-4 text-ink-secondary">{t.client.name}</td>
                    <td className="p-4 text-ink-secondary">{t.operator.name}</td>
                    <td className="p-4 font-medium text-ink">{formatCFA(t.amountCfa)}</td>
                    <td className="p-4 font-medium text-ink">{formatRUB(t.amountRub)}</td>
                    <td className={cn('p-4 text-xs font-bold', statusTone[t.status])}>
                      {t.status}
                    </td>
                    <td className="p-4 text-xs text-ink-faint">
                      {fullDate(t.takenAt ?? t.expiresAt)}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/operateur/transactions/${t.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        Opérateur
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && !rows.length ? (
          <p className="p-8 text-center text-sm text-ink-muted">Aucune transaction.</p>
        ) : null}
      </Card>

      <BottomSheet
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Transaction #${detail.id}` : ''}
      >
        {detail ? (
          <div className="space-y-3 text-sm text-ink-secondary">
            <p className="font-display text-lg font-semibold text-ink">
              {formatCFA(detail.amountCfa)} ↔ {formatRUB(detail.amountRub)}
            </p>
            <p>Preuve client : {detail.clientProofUrl ?? '—'}</p>
            <p>Preuve opérateur : {detail.operatorProofUrl ?? '—'}</p>
            <p>
              Statut :{' '}
              <span className={cn('font-semibold', statusTone[detail.status])}>
                {detail.status}
              </span>
            </p>
            <p className="text-xs text-ink-muted">
              Aucune action admin sur ce flux — observation uniquement.
            </p>
            <Link
              href={`/operateur/transactions/${detail.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-pill border border-primary/30 bg-primary/10 py-3 text-sm font-semibold text-primary hover:bg-primary/15"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Ouvrir la fiche opérateur (actions)
            </Link>
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
