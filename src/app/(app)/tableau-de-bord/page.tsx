"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  ListOrdered,
  History,
  User,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
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
import {
  CLIENT_TRANSACTION_FLOW,
  clientTimelineStepIndex,
} from "@/types/transaction";

type QuickAction = {
  href: string;
  label: string;
  sub: string;
  Icon: typeof Plus;
  tone: "primary" | "accent" | "amber" | "violet";
  labelLines?: readonly [string, string];
};

const quickActions: ReadonlyArray<QuickAction> = [
  {
    href: "/demandes/nouvelle",
    label: "Nouvelle demande",
    sub: "Créer un échange",
    Icon: Plus,
    tone: "primary",
  },
  {
    href: "/mes-demandes",
    label: "Mes demandes",
    sub: "Suivi & statut",
    Icon: ListOrdered,
    tone: "accent",
  },
  {
    href: "/transactions",
    label: "Mes Transactions",
    sub: "Historique",
    Icon: History,
    tone: "amber",
  },
  {
    href: "/profil",
    label: "Mon Compte",
    labelLines: ["Mon", "Compte"],
    sub: "Compte & sécurité",
    Icon: User,
    tone: "violet",
  },
] as const;

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-base font-bold tracking-tight text-text-dark sm:text-lg">
        {title}
      </h2>
      <button
        type="button"
        className="rounded-full p-2 text-text-muted transition hover:bg-primary/[0.06] hover:text-primary"
        aria-label="Options"
      >
        <span className="block h-1 w-1 rounded-full bg-current" />
        <span className="mt-1 block h-1 w-1 rounded-full bg-current" />
        <span className="mt-1 block h-1 w-1 rounded-full bg-current" />
      </button>
    </div>
  );
}

function actionTone(tone: (typeof quickActions)[number]["tone"]) {
  switch (tone) {
    case "primary":
      return {
        iconBg: "bg-primary/10",
        iconFg: "text-primary",
      };
    case "accent":
      return {
        iconBg: "bg-accent/10",
        iconFg: "text-accent",
      };
    case "amber":
      return {
        iconBg: "bg-amber-500/10",
        iconFg: "text-amber-700",
      };
    case "violet":
      return {
        iconBg: "bg-violet-500/10",
        iconFg: "text-violet-700",
      };
  }
}

function actionTileStyle(tone: (typeof quickActions)[number]["tone"]) {
  switch (tone) {
    case "primary":
      return {
        accent: "before:bg-primary",
        bg: "bg-primary/[0.04] hover:bg-primary/[0.06]",
      };
    case "accent":
      return {
        accent: "before:bg-accent",
        bg: "bg-accent/[0.05] hover:bg-accent/[0.07]",
      };
    case "amber":
      return {
        accent: "before:bg-amber-500",
        bg: "bg-amber-500/[0.05] hover:bg-amber-500/[0.07]",
      };
    case "violet":
      return {
        accent: "before:bg-violet-500",
        bg: "bg-violet-500/[0.05] hover:bg-violet-500/[0.07]",
      };
  }
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
    <div className="relative -mx-4 -mt-4 overflow-hidden bg-bg-dark lg:mx-0 lg:mt-0">
      {/* Hero gradient (style app bancaire) */}
      <div className="relative px-4 pb-10 pt-6 lg:px-8 lg:pt-8">
        <div
          className="pointer-events-none absolute inset-0 bg-textured opacity-100"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/65 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-28 top-10 h-80 w-80 rounded-full bg-accent/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg-dark/40 via-transparent to-bg-dark/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[34rem] -translate-x-1/2 rounded-[40%] bg-gradient-to-b from-violet-500/15 via-primary/10 to-transparent blur-2xl"
          aria-hidden
        />

        <div className="relative mx-auto min-w-0 max-w-5xl xl:max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={me?.avatar ?? null}
                name={me?.name ?? session?.user?.name ?? "?"}
                size="sm"
                className="ring-1 ring-white/20"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white/85">
                  {firstName}
                </p>
                <p className="text-[11px] text-white/60">Tableau de bord</p>
              </div>
            </div>
            <Link
              href="/profil"
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition hover:bg-white/15"
            >
              Profil
            </Link>
          </div>

          <div className="mt-5">
            <div className="glass-card relative overflow-hidden p-4 text-white shadow-[0_14px_36px_rgba(0,0,0,0.22)] ring-1 ring-white/10 sm:p-5">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -left-10 -bottom-12 h-44 w-44 rounded-full bg-accent/10 blur-3xl"
                aria-hidden
              />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white/70 sm:text-xs">
                    DoniSend
                  </p>
                  <p className="mt-1 text-[11px] text-white/60">
                    Taux CFA ⇄ RUB
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-md">
                  Live
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="min-w-0">
                  <p className="truncate font-display text-3xl font-bold tracking-tight sm:text-4xl">
                    {rateLoading || !rate ? (
                      <span className="inline-block h-10 w-32 animate-pulse rounded-md bg-white/10 align-middle" />
                    ) : (
                      rate.rate.toFixed(4)
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    {rateLoading || !rate ? (
                      <>
                        <div className="h-6 w-40 animate-pulse rounded-full bg-white/10" />
                        <div className="h-6 w-36 animate-pulse rounded-full bg-white/10" />
                      </>
                    ) : (
                      <>
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/85 backdrop-blur-md">
                          1 CFA ={" "}
                          <span className="font-semibold text-white tabular-nums">
                            {rate.rate.toFixed(4)}
                          </span>{" "}
                          RUB
                        </span>
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/85 backdrop-blur-md">
                          1 RUB ={" "}
                          <span className="font-semibold text-white tabular-nums">
                            {(rate.inverseRate ?? 0).toFixed(2)}
                          </span>{" "}
                          CFA
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques (remplace les 4 tuiles) */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-accent p-3 text-bg-dark shadow-[0_12px_30px_rgba(46,204,113,0.28)] sm:p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-bg-dark/70 sm:text-[11px]">
                Demandes
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums text-bg-dark sm:text-3xl">
                {mineLoading ? "—" : myCount}
              </p>
              <p className="mt-0.5 text-[11px] text-bg-dark/70">Publiées</p>
            </div>

            <div className="rounded-2xl bg-primary p-3 text-white shadow-[0_12px_30px_rgba(31,58,95,0.42)] sm:p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/75 sm:text-[11px]">
                Transactions
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums sm:text-3xl">
                {activeTx.length}
              </p>
              <p className="mt-0.5 text-[11px] text-white/70">Actives</p>
            </div>
          </div>

          {/* Promo card */}
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="relative mx-auto min-w-0 max-w-5xl rounded-t-3xl bg-white px-4 pb-10 pt-5 shadow-[0_-22px_60px_rgba(15,23,42,0.16)] lg:max-w-6xl lg:px-8">
        {me ? <NoWhatsappBanner user={me} /> : null}

        <section className="mt-2">
          <SectionTitle title="Paiements et transferts" />
          <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
            {quickActions.map(({ href, label, labelLines, Icon, tone }) => {
              const t = actionTone(tone);
              const tile = actionTileStyle(tone);
              return (
                <Link
                  key={`${href}-sheet`}
                  href={href}
                  className={cn(
                    "group relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl border border-slate-200/80 p-2.5 text-center shadow-sm ring-1 ring-slate-900/[0.04] transition sm:gap-2 sm:p-4",
                    // accent bar
                    "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:rounded-r-full before:opacity-80",
                    tile.accent,
                    tile.bg,
                    "hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-md",
                    "active:translate-y-0 active:scale-[0.99] active:shadow-sm",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-2xl shadow-sm ring-1 ring-slate-900/5 transition group-hover:scale-[1.03] sm:h-11 sm:w-11",
                      t.iconBg,
                    )}
                    aria-hidden
                  >
                    <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", t.iconFg)} />
                  </div>
                  <p className="text-[10px] font-semibold leading-tight text-text-dark sm:text-xs">
                    {labelLines ? (
                      <>
                        <span className="block">{labelLines[0]}</span>
                        <span className="block">{labelLines[1]}</span>
                      </>
                    ) : (
                      label
                    )}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {activeTx.length > 0 ? (
          <section className="mt-7">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-display text-base font-bold tracking-tight text-text-dark sm:text-lg">
                Transactions en cours
              </h2>
              <Link
                href="/transactions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Voir tout <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
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
                      className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-sm shadow-sm ring-1 ring-slate-900/[0.04] transition hover:border-primary/20 hover:shadow-md"
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
                            <span className="font-medium text-emerald-600">
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

        <section className="mt-7">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-base font-bold tracking-tight text-text-dark sm:text-lg">
              Mes dernières demandes
            </h2>
            <Link
              href="/mes-demandes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-3">
            {mineLoading ? (
              <div className="space-y-2.5">
                <Skeleton className="h-36 w-full rounded-2xl" />
                <Skeleton className="h-36 w-full rounded-2xl" />
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
              <Card className="rounded-2xl border-slate-200/80 bg-white p-6 text-center shadow-sm ring-1 ring-slate-900/[0.04]">
                <p className="text-sm font-bold text-text-dark">
                  Aucune demande publiée
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-text-muted sm:text-sm">
                  Créez votre première demande, puis suivez l’échange pas à pas.
                </p>
                <Link
                  href="/demandes/nouvelle"
                  className="btn-primary mt-5 inline-flex items-center gap-2 shadow-md shadow-primary/15"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Nouvelle demande
                </Link>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
