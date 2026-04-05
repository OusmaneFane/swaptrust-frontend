'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { RateDisplay } from '@/components/exchange/RateDisplay';
import { RequestCard } from '@/components/exchange/RequestCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { NoWhatsappBanner } from '@/components/dashboard/NoWhatsappBanner';
import { authApi, requestsApi, transactionsApi } from '@/services/api';
import { userWhatsappNotifyPhone } from '@/lib/user-phones';
import { cn, formatCFA, formatRUB, fromNow } from '@/lib/utils';
import {
  CLIENT_TRANSACTION_FLOW,
  clientTimelineStepIndex,
} from '@/types/transaction';

const quickActions = [
  {
    href: '/demandes/nouvelle',
    label: 'Nouvelle demande',
    sub: 'Besoin en CFA ou ₽',
    Icon: Plus,
    ring: 'ring-blue-500/15',
    iconBg: 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/25',
    card: 'border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-card to-card hover:border-primary/35 hover:shadow-md hover:shadow-primary/10',
  },
  {
    href: '/mes-demandes',
    label: 'Mes demandes',
    sub: 'Statut & détail',
    Icon: ListOrdered,
    ring: 'ring-teal-500/15',
    iconBg: 'bg-gradient-to-br from-accent to-emerald-600 text-white shadow-md shadow-accent/25',
    card: 'border-teal-200/70 bg-gradient-to-br from-teal-50/80 via-card to-card hover:border-accent/40 hover:shadow-md hover:shadow-accent/10',
  },
  {
    href: '/transactions',
    label: 'Mes transactions',
    sub: 'Historique des échanges',
    Icon: History,
    ring: 'ring-amber-500/15',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20',
    card: 'border-amber-200/80 bg-gradient-to-br from-amber-50/85 via-card to-card hover:border-amber-400/50 hover:shadow-md hover:shadow-amber-500/10',
  },
  {
    href: '/profil',
    label: 'Profil',
    sub: 'Compte & sécurité',
    Icon: User,
    ring: 'ring-violet-500/15',
    iconBg: 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/20',
    card: 'border-violet-200/70 bg-gradient-to-br from-violet-50/80 via-card to-card hover:border-violet-400/45 hover:shadow-md hover:shadow-violet-500/10',
  },
] as const;

function statCards(args: {
  myOrderCount: number;
  txActive: number;
  rateLabel: string;
}) {
  return [
    {
      title: 'Mes demandes',
      value: String(args.myOrderCount),
      hint: 'Publiées',
      Icon: Wallet,
      className:
        'border-slate-200/90 bg-gradient-to-br from-slate-50/90 to-card text-ink',
      iconWrap: 'bg-slate-100 text-slate-600',
    },
    {
      title: 'Transactions suivies',
      value: String(args.txActive),
      hint: 'Non terminées (aperçu)',
      Icon: BarChart3,
      className:
        'border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-card text-ink',
      iconWrap: 'bg-primary/15 text-primary',
    },
    {
      title: 'Taux XOF→RUB',
      value: args.rateLabel,
      hint: 'Indicatif',
      Icon: Percent,
      className:
        'border-accent/25 bg-gradient-to-br from-accent-soft/50 via-card to-card text-ink',
      iconWrap: 'bg-accent/15 text-accent',
    },
  ] as const;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function kycBadgeTone(
  s: string,
): 'muted' | 'warning' | 'success' | 'danger' {
  switch (s) {
    case 'VERIFIED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    default:
      return 'muted';
  }
}

function kycLabel(s: string): string {
  switch (s) {
    case 'VERIFIED':
      return 'Vérifié ✓';
    case 'PENDING':
      return 'KYC en cours…';
    case 'REJECTED':
      return 'KYC rejeté';
    default:
      return 'Non vérifié';
  }
}

export default function TableauDeBordPage() {
  const { data: session } = useSession();
  const { data: rate, isLoading: rateLoading } = useExchangeRate();
  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
  });
  const { data: myRequests = [], isLoading: mineLoading } = useQuery({
    queryKey: ['requests', 'mine'],
    queryFn: () => requestsApi.mine(),
  });
  const { data: recentTx } = useQuery({
    queryKey: ['transactions', 'dashboard'],
    queryFn: () => transactionsApi.list({ limit: 5 }),
  });

  const kyc = me?.kycStatus ?? 'NOT_SUBMITTED';
  const firstName =
    (me?.name ?? session?.user?.name)?.split(' ')[0] ?? 'toi';
  const myCount = myRequests.length;
  const displayRequests = myRequests.slice(0, 4);
  const activeTx =
    recentTx?.filter(
      (t) =>
        t.status !== 'COMPLETED' &&
        t.status !== 'CANCELLED' &&
        t.status !== 'DISPUTED',
    ) ?? [];

  const waPhone = userWhatsappNotifyPhone(me);

  return (
    <div className="mx-auto max-w-4xl space-y-8 lg:max-w-none">
      {me ? <NoWhatsappBanner user={me} /> : null}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-card border border-line bg-card p-5 shadow-card-lg md:p-6"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-gradient-to-tr from-violet-200/40 via-transparent to-transparent blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-sm" />
              <Avatar
                src={me?.avatar ?? null}
                name={me?.name ?? session?.user?.name ?? '?'}
                size="lg"
                className="relative ring-2 ring-white shadow-card"
              />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Espace personnel
              </p>
              <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
                Bonjour, {firstName}{' '}
                <span className="inline-block animate-pulse-slow">👋</span>
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  tone={kycBadgeTone(kyc)}
                  className={kyc === 'PENDING' ? 'animate-pulse' : undefined}
                >
                  {kycLabel(kyc)}
                </Badge>
                {!mineLoading && myCount > 0 && (
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                    {myCount} demande{myCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/demandes/nouvelle"
            className="inline-flex items-center gap-2 rounded-pill bg-gradient-to-r from-primary to-primary-dark px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:opacity-95 active:scale-[0.98]"
          >
            Nouvelle demande
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.header>

      <div className="grid gap-4 lg:grid-cols-5 lg:items-stretch">
        <div className="lg:col-span-3">
          {rateLoading || !rate ? (
            <Skeleton className="h-full min-h-[9rem] w-full rounded-card" />
          ) : (
            <RateDisplay
              rate={rate.rate}
              inverseRate={rate.inverseRate}
              trend={rate.trend}
              percentChange={rate.percentChange}
              fetchedAt={rate.fetchedAt}
              className="h-full min-h-[9rem] justify-center border-primary/15 bg-gradient-to-br from-card via-blue-50/40 to-accent-soft/30 shadow-card-lg"
            />
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-1">
          {statCards({
            myOrderCount: myCount,
            txActive: activeTx.length,
            rateLabel: rate ? rate.rate.toFixed(4) : '—',
          }).map(({ title, value, hint, Icon, className, iconWrap }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                'flex items-center gap-3 rounded-card border p-4 shadow-card transition hover:shadow-card-lg',
                className,
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-input',
                  iconWrap,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink-muted">{title}</p>
                <p className="font-display text-lg font-bold text-ink">{value}</p>
                <p className="text-xs text-ink-faint">{hint}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-accent" />
          <h2 className="font-display text-lg font-semibold text-ink">Raccourcis</h2>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          {quickActions.map(
            ({ href, label, sub, Icon, ring, iconBg, card }) => (
              <motion.div key={href} variants={item} whileTap={{ scale: 0.97 }}>
                <Link
                  href={href}
                  className={cn(
                    'group flex flex-col gap-3 rounded-card border p-4 shadow-card transition duration-200',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    card,
                    ring,
                  )}
                >
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-input transition group-hover:scale-105',
                      iconBg,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{label}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                    Ouvrir
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </motion.div>
            ),
          )}
        </motion.div>
      </div>

      {activeTx.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-8 w-1 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
            <h2 className="font-display text-lg font-semibold text-ink">
              Transactions en cours
            </h2>
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
                    className="glass-card flex flex-wrap items-center justify-between gap-2 p-4 text-sm hover:border-primary/30"
                  >
                    <div>
                      <p className="font-medium text-ink">Transaction #{t.id}</p>
                      {stepLabel ? (
                        <p className="text-xs font-medium text-primary">{stepLabel}</p>
                      ) : null}
                      <p className="text-ink-muted">
                        {formatCFA(t.amountCfa)} · {formatRUB(t.amountRub)}
                      </p>
                      <p className="text-xs text-ink-faint">
                        {t.takenAt ? fromNow(t.takenAt) : '—'}
                      </p>
                      <p className="mt-1 text-[11px] text-ink-faint">
                        WhatsApp :{' '}
                        {waPhone ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            notifications actives
                          </span>
                        ) : (
                          <span className="text-warning">non configuré</span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone="muted">{t.status}</Badge>
                      {waPhone ? (
                        <span className="rounded-pill border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                          WhatsApp
                        </span>
                      ) : (
                        <span className="rounded-pill border border-line bg-muted/40 px-2 py-0.5 text-[10px] text-ink-faint">
                          En attente config.
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-8 w-1 rounded-full bg-gradient-to-b from-accent to-primary" />
            <h2 className="font-display text-lg font-semibold text-ink">
              Mes demandes en cours
            </h2>
          </div>
          <Link
            href="/mes-demandes"
            className="inline-flex items-center gap-1 rounded-pill border border-line bg-card px-3 py-1.5 text-sm font-medium text-primary shadow-sm transition hover:border-primary/30 hover:bg-surface-hover"
          >
            Voir tout
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {mineLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-card" />
            <Skeleton className="h-28 w-full rounded-card" />
          </div>
        ) : displayRequests.length ? (
          <div className="space-y-3">
            {displayRequests.map((r) => (
              <RequestCard key={r.id} request={r} showStatus href={`/demandes/${r.id}`} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-primary/25 bg-gradient-to-br from-surface to-card text-center">
            <p className="text-sm font-medium text-ink">Aucune demande publiée</p>
            <p className="mt-1 text-sm text-ink-muted">
              Décrivez le montant et le moyen de paiement ; nous nous occupons de la suite.
            </p>
            <Link
              href="/demandes/nouvelle"
              className="btn-primary mt-4 inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle demande
            </Link>
          </Card>
        )}
      </section>

      <Card className="relative overflow-hidden border-primary/15 bg-gradient-to-br from-card via-blue-50/30 to-accent-soft/25">
        <div
          className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-input bg-primary/12 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display font-semibold text-ink">Statistiques</p>
              <p className="text-xs text-ink-muted">
                Données enrichies dès branchement de l’API
              </p>
            </div>
          </div>
          <p className="text-sm text-ink-secondary">
            Volume affiché : <strong className="text-ink">{formatCFA(0)}</strong> — connectez{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-primary">
              GET /users/me/stats
            </code>{' '}
            pour des métriques réelles (graphiques, tendances, etc.).
          </p>
        </div>
      </Card>
    </div>
  );
}
