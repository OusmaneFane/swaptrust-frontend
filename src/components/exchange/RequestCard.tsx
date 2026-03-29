'use client';

import Link from 'next/link';
import type { ExchangeRequest, RequestStatus } from '@/types';
import { formatCFA, formatRUB, fromNow } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { PAYMENT_METHOD_LABELS } from '@/constants/payment-methods';
import { cn } from '@/lib/utils';

const REQUEST_STATUS_CLIENT: Record<
  RequestStatus,
  { label: string; tone: 'default' | 'success' | 'warning' | 'danger' | 'muted' }
> = {
  PENDING: { label: "En attente d'opérateur", tone: 'warning' },
  IN_PROGRESS: { label: 'Prise en charge', tone: 'default' },
  COMPLETED: { label: 'Terminée', tone: 'success' },
  CANCELLED: { label: 'Annulée', tone: 'danger' },
  EXPIRED: { label: 'Expirée', tone: 'muted' },
};

type Props = {
  request: ExchangeRequest;
  href?: string;
  className?: string;
  showStatus?: boolean;
};

export function RequestCard({
  request: r,
  href,
  className,
  showStatus = true,
}: Props) {
  const needRub = r.type === 'NEED_RUB';
  const to = href ?? `/demandes/${r.id}`;
  const statusMeta = REQUEST_STATUS_CLIENT[r.status];

  return (
    <Link
      href={to}
      className={cn(
        'glass-card block p-4 transition-all hover:border-primary/35 hover:shadow-card-lg active:scale-[0.99]',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink">
            {needRub ? 'Besoin de roubles' : 'Besoin de CFA'}
          </p>
          <p className="text-xs text-ink-muted">{fromNow(r.createdAt)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone="muted">
            {PAYMENT_METHOD_LABELS[r.paymentMethod] ?? r.paymentMethod}
          </Badge>
          {showStatus ? (
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-ink-faint">Vous recevez</p>
          <p className="font-display text-xl font-bold text-ink">
            {needRub
              ? formatRUB(r.amountWanted)
              : formatCFA(r.amountWanted)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-faint">Vous envoyez</p>
          <p className="font-display text-lg font-semibold text-accent">
            {needRub
              ? formatCFA(r.amountToSend)
              : formatRUB(r.amountToSend)}
          </p>
        </div>
      </div>
      {r.note ? (
        <p className="mt-3 line-clamp-2 border-t border-line/80 pt-3 text-xs text-ink-secondary">
          <span className="font-medium text-ink-muted">Note :</span> {r.note}
        </p>
      ) : null}
    </Link>
  );
}
