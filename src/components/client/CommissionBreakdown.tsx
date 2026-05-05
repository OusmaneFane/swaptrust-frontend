"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn, formatCFA, formatRUB } from "@/lib/utils";
import type { RequestType } from "@/types";

export interface CommissionBreakdownProps {
  type: RequestType;
  /** Même échelle que GET /rates/current `.rate` / `.rateWithSpread` (₽ pour 1 F CFA). */
  googleRatePerCfa: number;
  /** Optionnel : taux inverse direct API (F CFA pour 1 ₽). */
  inverseRatePerRub?: number;
  percentChange24h?: number;
  trend?: "up" | "down" | "stable";
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
  inverseRatePerRub,
  percentChange24h = 0,
  trend = "stable",
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
  const sendIsCfa = type === "NEED_RUB";
  const formatSend = sendIsCfa ? formatCFA : formatRUB;
  const formatRecv = sendIsCfa ? formatRUB : formatCFA;

  const Icon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-danger"
        : "text-text-muted";

  const rubPerCfa = Number.isFinite(googleRatePerCfa) ? googleRatePerCfa : 0;
  const cfaPerRub =
    inverseRatePerRub != null && Number.isFinite(inverseRatePerRub) && inverseRatePerRub > 0
      ? inverseRatePerRub
      : rubPerCfa > 0
        ? 1 / rubPerCfa
        : 0;
  const rubPerCfaDisplay = rubPerCfa > 0 ? rubPerCfa.toFixed(4) : "—";
  const cfaPerRubDisplay = cfaPerRub > 0 ? cfaPerRub.toFixed(2) : "—";
  const rateLine = `1 F CFA = ${rubPerCfaDisplay} ₽`;
  const inverseRateLine = `1 ₽ = ${cfaPerRubDisplay} F CFA`;

  const netFootnote = sendIsCfa
    ? `Calculé sur ${formatCFA(netSendMinor)} au taux (référence ci-dessus).`
    : `Calculé sur ${formatRUB(netSendMinor)} ; référence taux : ${rateLine} (${inverseRateLine}).`;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-card border border-primary/10 bg-gradient-to-br from-white to-primary/[0.04] p-4 shadow-card",
        compact && "gap-2 p-3",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 pb-3 ">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-success shadow-sm shadow-success/40"
            aria-hidden
          />
          <span className="text-sm font-medium text-slate-600">
            Taux actuel 
          </span>
        </div>
        <div className="text-right">
          <span className="block font-display text-sm font-bold tabular-nums text-text-dark md:text-base">
            {rateLine}
          </span>
          <span className="block text-[11px] tabular-nums text-slate-500">
            {inverseRateLine}
          </span>
        </div>
        {!compact ? (
          <div
            className={cn("flex w-full items-center gap-1 text-xs", trendColor)}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {trend === "stable"
              ? "Stable"
              : trend === "up"
                ? "Hausse"
                : "Baisse"}
            {percentChange24h !== 0 ? (
              <span className="text-text-muted">
                {" "}
                · {percentChange24h > 0 ? "+" : ""}
                {percentChange24h.toFixed(2)}% (24 h)
              </span>
            ) : null}
          </div>
        ) : null}
        {fetchedAt && !compact ? (
          <p className="w-full text-[11px] text-slate-500">
            Mis à jour {new Date(fetchedAt).toLocaleString("fr-FR")}
          </p>
        ) : null}
      </div>

      <div className={cn("space-y-2 text-sm", compact && "text-xs")}>
        <div className="flex justify-between gap-3">
          <span className="text-text-muted">Montant échangé</span>
          <span className="text-right font-medium text-text-dark">
            {formatSend(netSendMinor)}
          </span>
        </div>
        <p className="-mt-1 text-right text-[11px] text-slate-500">
          hors commission
        </p>
        <div className="flex justify-between gap-3">
          <span className="text-text-muted">
            Commission DoniSend ({commissionPercent}%)
            <span className="ml-1 text-[10px] text-slate-500">
              service sécurisé
            </span>
          </span>
          <span className="text-right font-medium text-accent">
            + {formatSend(commissionSendMinor)}
          </span>
        </div>
        {commissionSecondaryLabel ? (
          <p className="-mt-1 text-right text-[11px] text-text-muted">
            {commissionSecondaryLabel}
          </p>
        ) : null}
      </div>

      <div className="flex justify-between gap-3 border-t border-primary/10 pt-3">
        <span className="font-semibold text-text-dark">Total à envoyer</span>
        <span className="font-display text-lg font-bold tabular-nums text-text-dark">
          {formatSend(totalSendMinor)}
        </span>
      </div>

      <div className="rounded-input border border-primary/20 bg-primary/[0.06] px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-text-muted">Vous recevrez</span>
          <span className="font-display text-base font-bold text-primary md:text-lg">
            {formatRecv(receiveMinor)}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          {netFootnote}
        </p>
      </div>

      {!compact ? (
        <p className="text-center text-[10px] leading-snug text-slate-500">
          Le taux provient de l’API. La commission est affichée à part — rien
          n’est « caché » dans le taux.
        </p>
      ) : null}
    </div>
  );
}
