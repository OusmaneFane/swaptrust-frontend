'use client';

import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ExchangeRate } from '@/types/api-dtos';

export function RateDisplay({
  rate,
  inverseRate,
  rateWithSpread,
  rubPerXofWithSpread,
  trend,
  percentChange,
  fetchedAt,
  className,
}: ExchangeRate & { className?: string }) {
  const Icon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const color =
    trend === 'up'
      ? 'text-success'
      : trend === 'down'
        ? 'text-danger'
        : 'text-text-muted';
  const updatedShort = new Date(fetchedAt).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const updatedLong = new Date(fetchedAt).toLocaleString('fr-FR');
  const trendLabel =
    trend === 'stable' ? 'Stable' : trend === 'up' ? 'Hausse' : 'Baisse';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-card border border-primary/15 bg-gradient-to-br from-white via-primary/[0.04] to-accent-soft/20 p-2 shadow-md sm:p-5 sm:shadow-card-lg',
        'max-sm:shadow-sm',
        className,
      )}
    >
      {/* Très petit écran : 2 lignes seulement */}
      <div className="space-y-0.5 sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase leading-none tracking-wide text-text-muted">
            Taux · XOF↔RUB
          </span>
          <span
            className={cn(
              'flex shrink-0 items-center gap-0.5 text-[10px] font-medium leading-none',
              color,
            )}
          >
            <Icon className="h-3 w-3" strokeWidth={2.5} />
            {trendLabel}
            {percentChange !== 0 ? (
              <span className="ml-0.5 tabular-nums text-text-muted">
                · {percentChange > 0 ? '↑' : '↓'}
                {Math.abs(percentChange).toFixed(1)}%
              </span>
            ) : null}
          </span>
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className="font-display text-xl font-bold tabular-nums tracking-tight text-accent">
            {rate.toFixed(4)}
          </span>
          <time
            className="shrink-0 text-[9px] leading-none text-text-muted"
            dateTime={fetchedAt}
          >
            {updatedShort}
          </time>
        </div>
      </div>

      {/* sm et plus : détail inchangé (un peu resserré) */}
      <div className="hidden flex-col gap-2 sm:flex sm:gap-2">
        <span className="text-sm font-medium leading-snug text-text-dark">
          Taux Google (brut) — XOF ↔ RUB, hors commission
        </span>
        <div className="flex flex-wrap items-end gap-2 sm:gap-3">
          <span className="font-display text-3xl font-bold tracking-tight text-accent md:text-4xl">
            {rate.toFixed(4)}
          </span>
          <span
            className={cn(
              'flex items-center gap-1 text-sm font-medium text-text-dark',
              color,
            )}
          >
            <Icon className="h-4 w-4" />
            {trendLabel}
          </span>
        </div>
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-dark">1 XOF</span> ≈{' '}
          <span className="text-accent">{rate.toFixed(4)} RUB</span>
          <span className="mx-1.5 text-text-dark">·</span>
          <span className="font-medium text-text-dark">1 RUB</span> ≈{' '}
          <span className="text-accent">
            {(inverseRate ?? 0).toFixed(4)} XOF
          </span>
        </p>
        {percentChange !== 0 ? (
          <p className="text-xs text-text-muted">
            {percentChange > 0 ? '↑' : '↓'} {Math.abs(percentChange).toFixed(2)}%
            (24 h)
          </p>
        ) : null}
        {rateWithSpread != null && rateWithSpread > 0 ? (
          <p className="hidden text-xs text-text-muted lg:block">
            Marge indicative (non utilisée comme taux client) :{' '}
            <span className="font-mono text-text-dark">
              {rateWithSpread.toFixed(4)} ₽/F
            </span>
            {rubPerXofWithSpread != null && rubPerXofWithSpread > 0 ? (
              <>
                {' '}
                ·{' '}
                <span className="font-mono text-text-dark">
                  {rubPerXofWithSpread.toFixed(2)} F/₽
                </span>
              </>
            ) : null}
          </p>
        ) : null}
        <p className="text-xs text-text-muted">
          Les demandes utilisent ce taux + commission séparée. Mis à jour{' '}
          {updatedLong}
        </p>
      </div>
    </motion.div>
  );
}
