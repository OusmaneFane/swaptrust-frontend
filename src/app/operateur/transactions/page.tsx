'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { operatorApi } from '@/services/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCFA, formatRUB, fromNow } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { TRANSACTION_STEPS } from '@/types/transaction';

export default function OperateurTransactionsPage() {
  const { data: list = [], isLoading } = useQuery({
    queryKey: ['operator', 'transactions', 'list'],
    queryFn: () => operatorApi.getMyTransactions(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Mes transactions</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Transactions prises en charge et suivies par vous.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-24 w-full rounded-card" />
        </div>
      ) : list.length ? (
        <ul className="space-y-2">
          {list.map((t) => {
            const meta = TRANSACTION_STEPS[t.status];
            return (
              <li key={t.id}>
                <Link
                  href={`/operateur/transactions/${t.id}`}
                  className="glass-card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-primary/30"
                >
                  <div>
                    <p className="font-medium text-ink">#{t.id}</p>
                    <p className="text-sm text-ink-muted">Client : {t.client.name}</p>
                    <p className="text-xs text-ink-faint">
                      {formatCFA(t.amountCfa)} ↔ {formatRUB(t.amountRub)} ·{' '}
                      {t.takenAt ? fromNow(t.takenAt) : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="muted">{meta.label}</Badge>
                    <ArrowRight className="h-4 w-4 text-ink-faint" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">Aucune transaction.</p>
      )}
    </div>
  );
}
