'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, ChevronRight } from 'lucide-react';
import type { ExchangeRequest, RequestStatus } from '@/types';
import type { PaymentMethod } from '@/types/order';
import { formatCFA, formatRUB, fromNow } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  PAYMENT_METHOD_LABELS,
  paymentBrandImageSrcForMethod,
} from '@/constants/payment-methods';
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

const logoBox =
  'relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-black/[0.06]';

function PaymentMethodLogo({ method }: { method: PaymentMethod }) {
  const [failed, setFailed] = useState(false);
  const src = paymentBrandImageSrcForMethod(method);
  const label = PAYMENT_METHOD_LABELS[method] ?? method;
  const initials = label
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const onError = useCallback(() => setFailed(true), []);

  if (!src || failed) {
    return (
      <span
        className={cn(
          logoBox,
          'bg-slate-100 text-[10px] font-bold text-slate-500 ring-slate-200/80',
        )}
        aria-hidden
      >
        {initials}
      </span>
    );
  }

  return (
    <span className={logoBox}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="max-h-full max-w-full object-contain p-1"
        loading="lazy"
        decoding="async"
        onError={onError}
      />
    </span>
  );
}

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
        'group relative block overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur-sm transition-all duration-200 sm:p-3.5',
        'hover:-translate-y-px hover:border-primary/20 hover:bg-white hover:shadow-md hover:shadow-primary/[0.06] hover:ring-primary/10',
        'active:translate-y-0 active:scale-[0.995]',
        className,
      )}
    >
      <span
        className={cn(
          'absolute inset-y-2 left-0 w-0.5 rounded-full',
          needRub ? 'bg-gradient-to-b from-sky-400 to-blue-600' : 'bg-gradient-to-b from-amber-400 to-orange-500',
        )}
        aria-hidden
      />
      <div className="ml-2.5 flex flex-col gap-2 sm:ml-3">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-px text-[10px] font-semibold uppercase tracking-wide',
                needRub
                  ? 'bg-sky-500/10 text-sky-800'
                  : 'bg-amber-500/12 text-amber-900',
              )}
            >
              <ArrowRightLeft className="h-2.5 w-2.5 opacity-80" aria-hidden />
              {needRub ? 'Roubles' : 'CFA'}
            </span>
            <span className="text-[11px] text-text-muted">{fromNow(r.createdAt)}</span>
          </div>
          {showStatus ? (
            <Badge tone={statusMeta.tone} className="shrink-0 scale-95 text-[10px]">
              {statusMeta.label}
            </Badge>
          ) : null}
        </div>

        <p className="font-display text-sm font-bold leading-tight tracking-tight text-text-dark">
          {needRub ? 'Besoin de roubles' : 'Besoin de francs CFA'}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/90 px-2 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <PaymentMethodLogo method={r.paymentMethod} />
            <div className="min-w-0 leading-tight">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">
                Envoi
              </p>
              <p className="truncate text-xs font-semibold text-text-dark">
                {PAYMENT_METHOD_LABELS[r.paymentMethod] ?? r.paymentMethod}
              </p>
            </div>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-primary"
            aria-hidden
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-emerald-500/12 bg-emerald-500/[0.04] px-2 py-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-800/70">
              Recevez
            </p>
            <p className="mt-0.5 font-display text-base font-bold tabular-nums leading-none tracking-tight text-text-dark">
              {needRub ? formatRUB(r.amountWanted) : formatCFA(r.amountWanted)}
            </p>
          </div>
          <div className="rounded-lg border border-primary/12 bg-primary/[0.04] px-2 py-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-primary/80">
              Envoyez
            </p>
            <p className="mt-0.5 font-display text-sm font-bold tabular-nums leading-none tracking-tight text-primary">
              {needRub ? formatCFA(r.amountToSend) : formatRUB(r.amountToSend)}
            </p>
          </div>
        </div>

        {r.note ? (
          <p className="line-clamp-2 border-t border-slate-100 pt-2 text-[11px] leading-snug text-slate-600">
            <span className="font-semibold text-text-muted">Note ·</span> {r.note}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
