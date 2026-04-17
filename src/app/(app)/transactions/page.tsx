"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, History, Inbox } from "lucide-react";
import { fetchTransactions } from "@/services/transactionService";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCFA, formatRUB, fromNow, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { TransactionStatus } from "@/types";
import type { TransactionFilters } from "@/types/api-dtos";
import { TRANSACTION_STEPS } from "@/types/transaction";

const PERIOD_PRESETS: { value: string; label: string }[] = [
  { value: "", label: "Toutes périodes" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
];

const STATUS_OPTIONS: TransactionStatus[] = [
  "INITIATED",
  "CLIENT_SENT",
  "OPERATOR_VERIFIED",
  "OPERATOR_SENT",
  "COMPLETED",
  "DISPUTED",
  "CANCELLED",
];

function statusBadgeTone(
  s: TransactionStatus,
): "default" | "success" | "warning" | "danger" | "muted" {
  switch (s) {
    case "COMPLETED":
      return "success";
    case "CANCELLED":
    case "DISPUTED":
      return "danger";
    case "CLIENT_SENT":
    case "INITIATED":
      return "warning";
    default:
      return "default";
  }
}

const selectClass =
  "min-h-0 min-w-0 flex-1 basis-[5.5rem] rounded-lg border border-slate-200/90 bg-white px-2 py-1.5 text-[11px] font-medium text-text-dark shadow-sm ring-1 ring-slate-900/[0.03] transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 sm:basis-0 sm:px-2.5 sm:text-xs";

export default function TransactionsListPage() {
  const [status, setStatus] = useState<TransactionStatus | "">("");
  const [direction, setDirection] = useState<
    NonNullable<TransactionFilters["direction"]> | ""
  >("");
  const [period, setPeriod] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["transactions", "list", status, direction, period],
    queryFn: () =>
      fetchTransactions({
        ...(status ? { status } : {}),
        ...(direction ? { direction } : {}),
        ...(period ? { period } : {}),
      }),
  });

  const items = data?.items ?? [];

  return (
    <div className="relative mx-auto min-w-0 max-w-3xl pb-10 pt-0 xl:max-w-4xl">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[min(16rem,38vh)] max-w-2xl rounded-[40%] bg-gradient-to-b from-primary/[0.16] via-violet-500/[0.06] to-transparent blur-3xl"
        aria-hidden
      />

      <div className="relative space-y-4">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <History className="h-4 w-4" strokeWidth={2} aria-hidden />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
              Historique
            </h1>
            {!isLoading && items.length > 0 ? (
              <span className="rounded-full border border-primary/12 bg-primary/[0.07] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
                {items.length}
                {items.length > 1 ? " échanges" : " échange"}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <select
              aria-label="Sens de l’échange"
              className={selectClass}
              value={direction}
              onChange={(e) =>
                setDirection(
                  e.target.value as
                    | NonNullable<TransactionFilters["direction"]>
                    | "",
                )
              }
            >
              <option value="">Sens · tous</option>
              <option value="CFA_TO_RUB">CFA → RUB</option>
              <option value="RUB_TO_CFA">RUB → CFA</option>
            </select>
            <select
              aria-label="Statut de la transaction"
              className={cn(selectClass, "min-w-[6.5rem] sm:min-w-[7.5rem]")}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as TransactionStatus | "")
              }
            >
              <option value="">Statut · tous</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {TRANSACTION_STEPS[s].label}
                </option>
              ))}
            </select>
            <select
              aria-label="Période"
              className={cn(selectClass, "basis-[6rem] sm:basis-0")}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIOD_PRESETS.map(({ value, label }) => (
                <option key={value || "all"} value={value}>
                  {value === "" ? "Période · toutes" : label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-text-muted sm:text-xs">
            Ouvrez une ligne pour le détail et les instructions.
          </p>
        </header>

        {isLoading ? (
          <ul className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <li key={i}>
                <Skeleton className="h-[4.5rem] w-full rounded-xl" />
              </li>
            ))}
          </ul>
        ) : (
          <ul
            className={cn(
              "space-y-2.5 transition-opacity",
              isFetching ? "opacity-60" : "opacity-100",
            )}
          >
            {items.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/transactions/${t.id}`}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-sm ring-1 ring-slate-900/[0.04] transition",
                    "hover:-translate-y-px hover:border-primary/20 hover:bg-white hover:shadow-md hover:shadow-primary/[0.05]",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-text-muted">
                        #{t.id}
                      </span>
                      <Badge
                        tone={statusBadgeTone(t.status)}
                        className="text-[10px]"
                      >
                        {TRANSACTION_STEPS[t.status].label}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate font-display text-sm font-bold tabular-nums text-text-dark sm:text-base">
                      <span className="text-emerald-800/90">
                        {formatCFA(t.amountCfa)}
                      </span>
                      <span className="mx-1.5 font-normal text-slate-400">
                        ↔
                      </span>
                      <span className="text-sky-900/90">
                        {formatRUB(t.amountRub)}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {t.takenAt ? fromNow(t.takenAt) : "—"}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-primary"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {!isLoading && !items.length ? (
          <div className="rounded-xl border border-dashed border-primary/25 bg-white/80 p-8 text-center shadow-inner backdrop-blur-sm sm:p-10">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-violet-500/10 text-primary">
              <Inbox className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="text-sm font-bold text-text-dark">
              Aucune transaction
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-text-muted sm:text-sm">
              Ajustez les filtres ou lancez un échange depuis le tableau de
              bord.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
