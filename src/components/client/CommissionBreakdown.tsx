'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn, formatCFA, formatRUB } from '@/lib/utils';
import { rubDisplayFor1000Cfa } from '@/lib/rate-xof-rub';
import type { RequestType } from '@/types';

export interface CommissionBreakdownProps {
  type: RequestType;
  /** Même échelle que GET /rates/current `.rate` (₽ pour 1 F CFA). */
  googleRatePerCfa: number;
  percentChange24h?: number;
  trend?: 'up' | 'down' | 'stable';
  fetchedAt?: string | null;
  netSendMinor: number;
  commissionPercent: number;
  commissionSendMinor: number;
  totalSendMinor: number;
  receiveMinor: number;
  /** Ex. commission API exprimée dans l’autre devise (« soit … »). */
  commissionSecondaryLabel?: string | null;
  className?: string;
  compact?: boolean;
}

export function CommissionBreakdown({
  type,
  googleRatePerCfa,
  percentChange24h = 0,
  trend = 'stable',
  fetchedAt,
  netSendMinor,
  commissionPercent,
  commissionSendMinor,
  totalSendMinor,
  receiveMinor,
  commissionSecondaryLabel,
  className,
  compact,
}: CommissionBreakdownProps) {
  const sendIsCfa = type === 'NEED_RUB';
  const formatSend = sendIsCfa ? formatCFA : formatRUB;
  const formatRecv = sendIsCfa ? formatRUB : formatCFA;

  const Icon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-success'
      : trend === 'down'
        ? 'text-danger'
        : 'text-ink-muted';

  const rateLine = `1 000 F CFA = ${rubDisplayFor1000Cfa(googleRatePerCfa)} ₽`;

  const netFootnote = sendIsCfa
    ? `Calculé sur ${formatCFA(netSendMinor)} au taux Google (référence ci-dessus).`
    : `Calculé sur ${formatRUB(netSendMinor)} ; référence taux Google : ${rateLine}.`;

  return (
    <div
      className={cn(
        'glass-card flex flex-col gap-3 border-primary/15 bg-gradient-to-br from-card to-primary/[0.03] p-4',
        compact && 'gap-2 p-3',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-success shadow-sm shadow-success/40"
            aria-hidden
          />
          <span className="text-sm font-medium text-ink-secondary">
            Taux Google (référence)
          </span>
        </div>
        <span className="font-display text-sm font-bold tabular-nums text-ink md:text-base">
          {rateLine}
        </span>
        {!compact ? (
          <div className={cn('flex w-full items-center gap-1 text-xs', trendColor)}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {trend === 'stable'
              ? 'Stable'
              : trend === 'up'
                ? 'Hausse'
                : 'Baisse'}
            {percentChange24h !== 0 ? (
              <span className="text-ink-muted">
                {' '}
                · {percentChange24h > 0 ? '+' : ''}
                {percentChange24h.toFixed(2)}% (24 h)
              </span>
            ) : null}
          </div>
        ) : null}
        {fetchedAt && !compact ? (
          <p className="w-full text-[11px] text-ink-faint">
            Mis à jour {new Date(fetchedAt).toLocaleString('fr-FR')}
          </p>
        ) : null}
      </div>

      <div className={cn('space-y-2 text-sm', compact && 'text-xs')}>
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted">Montant échangé</span>
          <span className="text-right font-medium text-ink">
            {formatSend(netSendMinor)}
          </span>
        </div>
        <p className="-mt-1 text-right text-[11px] text-ink-faint">hors commission</p>
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted">
            Commission SwapTrust ({commissionPercent}%)
            <span className="ml-1 text-[10px] text-ink-faint">service sécurisé</span>
          </span>
          <span className="text-right font-medium text-accent">
            + {formatSend(commissionSendMinor)}
          </span>
        </div>
        {commissionSecondaryLabel ? (
          <p className="-mt-1 text-right text-[11px] text-ink-muted">
            {commissionSecondaryLabel}
          </p>
        ) : null}
      </div>

      <div className="flex justify-between gap-3 border-t border-line pt-3">
        <span className="font-semibold text-ink">Total à envoyer</span>
        <span className="font-display text-lg font-bold tabular-nums text-ink">
          {formatSend(totalSendMinor)}
        </span>
      </div>

      <div className="rounded-input border border-primary/20 bg-primary/[0.06] px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-ink-muted">Vous recevrez</span>
          <span className="font-display text-base font-bold text-primary md:text-lg">
            {formatRecv(receiveMinor)}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">{netFootnote}</p>
      </div>

      {!compact ? (
        <p className="text-center text-[10px] leading-snug text-ink-faint">
          Taux indicatif vérifiable (ex. Google Finance). La commission est affichée à part — rien
          n’est « caché » dans le taux.
        </p>
      ) : null}
    </div>
  );
}
