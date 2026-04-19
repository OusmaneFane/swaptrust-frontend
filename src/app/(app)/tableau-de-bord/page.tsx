"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  ListOrdered,
  History,
  User,
  ArrowRight,
  Sparkles,
  BarChart3,
  Wallet,
  Percent,
  ChevronRight,
} from "lucide-react";
import { RateDisplay } from "@/components/exchange/RateDisplay";
import { RequestCard } from "@/components/exchange/RequestCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { NoWhatsappBanner } from "@/components/dashboard/NoWhatsappBanner";
import { authApi, requestsApi, transactionsApi } from "@/services/api";
import { userWhatsappNotifyPhone } from "@/lib/user-phones";
import { cn, formatCFA, formatRUB, fromNow } from "@/lib/utils";
import { CLIENT_TRANSACTION_FLOW, clientTimelineStepIndex } from "@/types/transaction";

const quickActions = [
  {
    href: "/demandes/nouvelle",
    label: "Nouvelle demande",
    sub: "CFA ou roubles",
    Icon: Plus,
    iconClass:
      "bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/25",
  },
  {
    href: "/mes-demandes",
    label: "Mes demandes",
    sub: "Statut et détail",
    Icon: ListOrdered,
    iconClass:
      "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20",
  },
  {
    href: "/transactions",
    label: "Transactions",
    sub: "Historique",
    Icon: History,
    iconClass:
      "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20",
  },
  {
    href: "/profil",
    label: "Profil",
    sub: "Compte et sécurité",
    Icon: User,
    iconClass:
      "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/20",
  },
] as const;

function statCards(args: {
  myOrderCount: number;
  txActive: number;
  rateLabel: string;
}) {
  return [
    {
      title: "Mes demandes",
      value: String(args.myOrderCount),
      hint: "Publiées",
      Icon: Wallet,
      className: "border-slate-200/80 bg-white/90",
      iconWrap: "bg-slate-100 text-slate-600",
    },
    {
      title: "Transactions actives",
      value: String(args.txActive),
      hint: "Non terminées",
      Icon: BarChart3,
      className: "border-primary/15 bg-primary/[0.04]",
      iconWrap: "bg-primary/12 text-primary",
    },
    {
      title: "Taux XOF→RUB",
      value: args.rateLabel,
      hint: "Indicatif",
      Icon: Percent,
      className: "border-accent/20 bg-accent-soft/30",
      iconWrap: "bg-accent/12 text-accent",
    },
  ] as const;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

function SectionTitle({
  title,
  accent = "from-primary to-accent",
}: {
  title: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn("h-7 w-1 shrink-0 rounded-full bg-gradient-to-b", accent)}
        aria-hidden
      />
      <h2 className="font-display text-base font-bold tracking-tight text-text-dark sm:text-lg">
        {title}
      </h2>
    </div>
  );
}

export default function TableauDeBordPage() {
  const { data: session } = useSession();
  const { data: rate, isLoading: rateLoading } = useExchangeRate();
  const { data: me } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
  });
  const { data: myRequests = [], isLoading: mineLoading } = useQuery({
    queryKey: ["requests", "mine"],
    queryFn: () => requestsApi.mine(),
  });
  const { data: recentTx } = useQuery({
    queryKey: ["transactions", "dashboard"],
    queryFn: () => transactionsApi.list({ limit: 5 }),
  });

  const firstName = (me?.name ?? session?.user?.name)?.split(" ")[0] ?? "toi";
  const myCount = myRequests.length;
  const displayRequests = myRequests.slice(0, 4);
  const activeTx =
    recentTx?.filter(
      (t) =>
        t.status !== "COMPLETED" &&
        t.status !== "CANCELLED" &&
        t.status !== "DISPUTED",
    ) ?? [];

  const waPhone = userWhatsappNotifyPhone(me);

  return (
    <div className="relative mx-auto min-w-0 max-w-5xl pb-10 pt-0 xl:max-w-6xl">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[min(18rem,42vh)] max-w-3xl rounded-[40%] bg-gradient-to-b from-primary/[0.18] via-violet-500/[0.07] to-transparent blur-3xl"
        aria-hidden
      />

      <div className="relative space-y-4 sm:space-y-6">
        {me ? <NoWhatsappBanner user={me} /> : null}

        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur-sm sm:p-5 md:p-6"
        >
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-gradient-to-br from-primary/15 to-accent/10 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-violet-400/15 blur-2xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="relative shrink-0">
                <span className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-primary/25 to-accent/15 blur-sm" />
                <Avatar
                  src={me?.avatar ?? null}
                  name={me?.name ?? session?.user?.name ?? "?"}
                  size="lg"
                  className="relative ring-2 ring-white shadow-md"
                />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" strokeWidth={2} />
                  Espace personnel
                </p>
                <h1 className="mt-0.5 truncate font-display text-xl font-bold tracking-tight text-text-dark sm:text-2xl">
                  Bonjour, {firstName}
                  <span
                    className="ml-1 inline-block text-lg animate-pulse-slow"
                    aria-hidden
                  >
                    👋
                  </span>
                </h1>
                {!mineLoading && myCount > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-primary/10 bg-primary/[0.06] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                      {myCount} demande{myCount > 1 ? "s" : ""}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
            <Link
              href="/demandes/nouvelle"
              className={cn(
                "btn-primary inline-flex w-full shrink-0 items-center justify-center gap-2 shadow-md shadow-primary/20 sm:w-auto sm:px-5",
              )}
            >
              Nouvelle demande
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
        </motion.header>

        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-5 lg:items-stretch">
          <div className="min-h-0 lg:col-span-3">
            {rateLoading || !rate ? (
              <Skeleton className="h-full min-h-[3.75rem] w-full rounded-2xl sm:min-h-[7rem] lg:min-h-[8.5rem]" />
            ) : (
              <RateDisplay
                rate={rate.rate}
                inverseRate={rate.inverseRate}
                trend={rate.trend}
                percentChange={rate.percentChange}
                fetchedAt={rate.fetchedAt}
                className="h-auto min-h-0 justify-center rounded-2xl border-slate-200/80 bg-white/90 shadow-sm ring-1 ring-slate-900/[0.04] lg:min-h-[8.5rem]"
              />
            )}
          </div>
          <div className="flex gap-1.5 lg:col-span-2 lg:grid lg:grid-cols-1 lg:gap-2.5">
            {statCards({
              myOrderCount: myCount,
              txActive: activeTx.length,
              rateLabel: rate ? rate.rate.toFixed(4) : "—",
            }).map(({ title, value, hint, Icon, className, iconWrap }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 }}
                className={cn(
                  "flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-2 text-center shadow-sm ring-1 ring-slate-900/[0.03] transition hover:shadow-md",
                  "lg:flex lg:w-full lg:flex-none lg:basis-auto lg:flex-row lg:items-center lg:justify-start lg:gap-3 lg:px-3 lg:py-3 lg:text-left",
                  className,
                )}
              >
                <div
                  className={cn(
                    "hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg lg:flex",
                    iconWrap,
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                </div>
                <div className="min-w-0 px-0.5">
                  <p className="text-[8px] font-semibold uppercase leading-tight tracking-wide text-text-muted sm:text-[9px] lg:text-[10px]">
                    {title}
                  </p>
                  <p className="font-display text-sm font-bold tabular-nums leading-tight text-text-dark sm:text-base">
                    {value}
                  </p>
                  <p className="text-[8px] leading-tight text-slate-500 sm:text-[10px] lg:text-[11px]">
                    {hint}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <section>
          <div className="mb-2 sm:mb-3">
            <SectionTitle title="Raccourcis" />
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3"
          >
            {quickActions.map(({ href, label, sub, Icon, iconClass }) => (
              <motion.div key={href} variants={item} whileTap={{ scale: 0.98 }}>
                <Link
                  href={href}
                  className={cn(
                    "group flex h-full flex-col gap-2 rounded-xl border border-slate-200/80 bg-white/90 p-2.5 shadow-sm ring-1 ring-slate-900/[0.04] transition duration-200 sm:gap-2.5 sm:p-3",
                    "hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white hover:shadow-md hover:shadow-primary/[0.06]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition group-hover:scale-105 sm:h-10 sm:w-10 sm:rounded-xl",
                      iconClass,
                    )}
                  >
                    <Icon
                      className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                      strokeWidth={2.2}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold leading-tight text-text-dark sm:text-xs">
                      {label}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-text-muted sm:text-[10px]">
                      {sub}
                    </p>
                  </div>
                  <span className="mt-auto hidden items-center gap-0.5 text-[10px] font-semibold text-primary opacity-0 transition group-hover:opacity-100 sm:inline-flex">
                    Ouvrir
                    <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {activeTx.length > 0 ? (
          <section>
            <div className="mb-3">
              <SectionTitle
                title="Transactions en cours"
                accent="from-amber-500 to-orange-500"
              />
            </div>
            <ul className="space-y-2">
              {activeTx.map((t) => {
                const si = clientTimelineStepIndex(t.status);
                const stepLabel =
                  si >= 0
                    ? `Étape ${si + 1}/${CLIENT_TRANSACTION_FLOW.length}`
                    : null;
                return (
                  <li key={t.id}>
                    <Link
                      href={`/transactions/${t.id}`}
                      className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3 text-sm shadow-sm ring-1 ring-slate-900/[0.04] transition hover:border-primary/20 hover:shadow-md"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-text-dark">
                          Transaction #{t.id}
                        </p>
                        {stepLabel ? (
                          <p className="text-[11px] font-semibold text-primary">
                            {stepLabel}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-xs text-text-muted">
                          {formatCFA(t.amountCfa)} · {formatRUB(t.amountRub)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {t.takenAt ? fromNow(t.takenAt) : "—"}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          WhatsApp :{" "}
                          {waPhone ? (
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              actif
                            </span>
                          ) : (
                            <span className="font-medium text-amber-700">
                              non configuré
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="flex flex-col items-end gap-1">
                          <Badge tone="muted" className="text-[10px]">
                            {t.status}
                          </Badge>
                          {waPhone ? (
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-px text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                              WhatsApp
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-px text-[9px] text-slate-500">
                              Config.
                            </span>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-primary" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <SectionTitle title="Mes demandes" />
            <Link
              href="/mes-demandes"
              className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm transition hover:border-primary/30 hover:bg-primary/[0.04]"
            >
              Voir tout
              <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </div>
          {mineLoading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-xl" />
            </div>
          ) : displayRequests.length ? (
            <div className="space-y-2.5">
              {displayRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  showStatus
                  href={`/demandes/${r.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-primary/25 bg-white/80 p-6 text-center shadow-inner backdrop-blur-sm sm:p-8">
              <p className="text-sm font-bold text-text-dark">
                Aucune demande publiée
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-text-muted sm:text-sm">
                Décrivez le montant et le moyen de paiement ; nous nous occupons
                de la suite.
              </p>
              <Link
                href="/demandes/nouvelle"
                className="btn-primary mt-5 inline-flex items-center gap-2 shadow-md shadow-primary/15"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Nouvelle demande
              </Link>
            </div>
          )}
        </section>

        <Card className="relative overflow-hidden rounded-2xl border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-primary/[0.04] p-5 shadow-sm ring-1 ring-slate-900/[0.04]">
          <div
            className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-primary/10 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <BarChart3 className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-text-dark sm:text-base">
                  Statistiques
                </p>
                <p className="text-[11px] text-text-muted">
                  Données enrichies après branchement API
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              Volume affiché :{" "}
              <strong className="text-text-dark">{formatCFA(0)}</strong> —
              branchez{" "}
              <code className="rounded-md border border-primary/10 bg-white px-1.5 py-0.5 font-mono text-[11px] text-primary">
                GET /users/me/stats
              </code>{" "}
              pour des métriques réelles (tendances, graphiques, etc.).
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
