"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ExchangeRate } from "@/types/api-dtos";

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
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const color =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-danger"
        : "text-text-muted";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col gap-2 rounded-card border border-primary/15 bg-bg-card p-5 shadow-card-lg",
        className,
      )}
    >
      <span className="text-sm font-medium text-text-primary">
        Taux Google (brut) — XOF ↔ RUB, hors commission
      </span>
      <div className="flex flex-wrap items-end gap-3">
        <span className="font-display text-3xl font-bold tracking-tight text-accent md:text-4xl">
          {rate.toFixed(4)}
        </span>
        <span
          className={cn("flex items-center gap-1 text-sm font-medium text-text-primary", color)}
        >
          <Icon className="h-4 w-4" />
          {trend === "stable" ? "Stable" : trend === "up" ? "Hausse" : "Baisse"}
        </span>
      </div>
      <p className="text-sm text-text-primary">
        <span className="font-medium text-text-primary">1 XOF</span> ≈{" "}
        <span className="text-accent">{rate.toFixed(4)} RUB</span>
        <span className="mx-1.5 text-text-primary">·</span>
        <span className="font-medium text-text-primary">1 RUB</span> ≈{" "}
        <span className="text-accent">
          {(inverseRate ?? 0).toFixed(4)} XOF
        </span>
      </p>
      {percentChange !== 0 ? (
        <p className="text-xs text-text-primary">
          {percentChange > 0 ? "↑" : "↓"} {Math.abs(percentChange).toFixed(2)}%
          (24 h)
        </p>
      ) : null}
      {rateWithSpread != null && rateWithSpread > 0 ? (
        <p className="text-xs text-text-primary">
          Marge indicative (non utilisée comme taux client) :{" "}
          <span className="font-mono text-text-primary">
            {rateWithSpread.toFixed(4)} ₽/F
          </span>
          {rubPerXofWithSpread != null && rubPerXofWithSpread > 0 ? (
            <>
              {" "}
              ·{" "}
              <span className="font-mono text-text-primary">
                {rubPerXofWithSpread.toFixed(2)} F/₽
              </span>
            </>
          ) : null}
        </p>
      ) : null}
      <p className="text-xs text-text-primary">
        Les demandes utilisent ce taux + commission séparée. Mis à jour{" "}
        {new Date(fetchedAt).toLocaleString("fr-FR")}
      </p>
    </motion.div>
  );
}
