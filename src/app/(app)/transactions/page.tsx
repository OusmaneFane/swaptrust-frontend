'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactions } from '@/services/transactionService';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCFA, formatRUB, fromNow } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { TransactionStatus } from '@/types';
import type { TransactionFilters } from '@/types/api-dtos';
import { TRANSACTION_STEPS } from '@/types/transaction';

const PERIOD_PRESETS: { value: string; label: string }[] = [
  { value: '', label: 'Toutes périodes' },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
];

const STATUS_OPTIONS: TransactionStatus[] = [
  'INITIATED',
  'SENDER_SENT',
  'RECEIVER_CONFIRMED',
  'RUB_SENT',
  'COMPLETED',
  'DISPUTED',
  'CANCELLED',
];

export default function TransactionsListPage() {
  const [status, setStatus] = useState<TransactionStatus | ''>('');
  const [direction, setDirection] = useState<
    NonNullable<TransactionFilters['direction']> | ''
  >('');
  const [period, setPeriod] = useState('');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['transactions', 'list', status, direction, period],
    queryFn: () =>
      fetchTransactions({
        ...(status ? { status } : {}),
        ...(direction ? { direction } : {}),
        ...(period ? { period } : {}),
      }),
  });

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-2xl">
      <h1 className="font-display text-2xl font-bold">Historique</h1>

      <div className="flex flex-wrap gap-2">
        <select
          className="input-field max-w-[200px] py-2 text-sm"
          value={direction}
          onChange={(e) =>
            setDirection(
              e.target.value as NonNullable<TransactionFilters['direction']> | '',
            )
          }
        >
          <option value="">Sens</option>
          <option value="CFA_TO_RUB">CFA → RUB</option>
          <option value="RUB_TO_CFA">RUB → CFA</option>
        </select>
        <select
          className="input-field min-w-[180px] max-w-[220px] py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as TransactionStatus | '')}
        >
          <option value="">Statut</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {TRANSACTION_STEPS[s].label}
            </option>
          ))}
        </select>
        <select
          className="input-field max-w-[160px] py-2 text-sm"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {PERIOD_PRESETS.map(({ value, label }) => (
            <option key={value || 'all'} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-card" />
          ))}
        </div>
      ) : (
        <ul
          className={`space-y-3 ${isFetching ? 'opacity-70 transition-opacity' : ''}`}
        >
          {items.map((t) => (
            <li key={t.id}>
              <Link
                href={`/transactions/${t.id}`}
                className="glass-card block p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-ink-muted">#{t.id}</span>
                  <Badge tone="muted">{t.status}</Badge>
                </div>
                <p className="mt-2 font-medium">
                  {formatCFA(t.amountCfa)} ↔ {formatRUB(t.amountRub)}
                </p>
                <p className="text-xs text-ink-faint">{fromNow(t.initiatedAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!isLoading && !items.length ? (
        <p className="text-center text-sm text-ink-muted">Aucune transaction.</p>
      ) : null}
    </div>
  );
}
