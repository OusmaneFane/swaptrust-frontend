'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  BadgeCheck,
  Coins,
  Inbox,
  Scale,
  TrendingUp,
  Users,
  ArrowLeftRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { AdminKycPendingList } from '@/components/admin/AdminKycPendingList';
import { adminApi } from '@/services/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Transaction } from '@/types';
import { formatCFA } from '@/lib/utils';

function InlineCode({ children }: { children: string }) {
  return (
    <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
      {children}
    </code>
  );
}

function KpiCard({
  label,
  value,
  Icon,
  tone,
  warn,
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  warn?: boolean;
}) {
  const tones: Record<typeof tone, { ring: string; bg: string; iconBg: string; iconFg: string }> = {
    indigo: {
      ring: 'ring-indigo-500/10',
      bg: 'from-indigo-500/[0.14] via-white to-white',
      iconBg: 'bg-indigo-600',
      iconFg: 'text-white',
    },
    emerald: {
      ring: 'ring-emerald-500/10',
      bg: 'from-emerald-500/[0.14] via-white to-white',
      iconBg: 'bg-emerald-600',
      iconFg: 'text-white',
    },
    amber: {
      ring: 'ring-amber-500/10',
      bg: 'from-amber-500/[0.14] via-white to-white',
      iconBg: 'bg-amber-600',
      iconFg: 'text-white',
    },
    rose: {
      ring: 'ring-rose-500/10',
      bg: 'from-rose-500/[0.14] via-white to-white',
      iconBg: 'bg-rose-600',
      iconFg: 'text-white',
    },
    slate: {
      ring: 'ring-slate-900/[0.06]',
      bg: 'from-slate-900/[0.06] via-white to-white',
      iconBg: 'bg-slate-900',
      iconFg: 'text-white',
    },
  };

  const t = tones[tone];

  return (
    <Card
      className={cn(
        'relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl',
        'ring-1',
        warn ? 'border-warning/25 bg-warning/10 ring-warning/15' : t.ring,
      )}
    >
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br', t.bg)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-text-dark">
            {value}
          </p>
        </div>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-slate-900/[0.06]',
            t.iconBg,
            t.iconFg,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}

type RevenuePeriod = 'day' | 'week' | 'month' | 'year';
type Preset = '7d' | '30d' | '90d';

function txDateIso(t: Transaction): string {
  return (
    t.takenAt ??
    t.clientSentAt ??
    t.operatorSentAt ??
    t.completedAt ??
    t.expiresAt
  );
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export default function AdminDashboardPage() {
  const [revPeriod, setRevPeriod] = useState<RevenuePeriod>('month');
  const [preset, setPreset] = useState<Preset>('30d');

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.dashboard(),
  });

  const { data: pendingKyc = [], isLoading: kycLoading } = useQuery({
    queryKey: ['admin', 'kyc', 'pending'],
    queryFn: () => adminApi.kycPending(),
  });

  const revenueQuery = useQuery({
    queryKey: ['admin', 'revenue-summary', revPeriod],
    queryFn: () => adminApi.revenueSummary(revPeriod),
    retry: false,
  });

  const txQuery = useQuery({
    queryKey: ['admin', 'transactions', 'dashboard'],
    queryFn: () => adminApi.allTransactions(),
    retry: false,
  });

  const k = kpis ?? {
    users: 0,
    kycPending: 0,
    txActive: 0,
    disputesOpen: 0,
    requestsPending: 0,
  };

  const txRows = useMemo(() => txQuery.data ?? [], [txQuery.data]);

  const chart = useMemo(() => {
    const now = new Date();
    const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30;
    const from = startOfDay(addDays(now, -days + 1));
    const fromMs = from.getTime();

    const map = new Map<string, { day: string; volumeCfa: number; commissionCfa: number; count: number }>();
    for (const t of txRows) {
      const d = new Date(txDateIso(t));
      const ms = d.getTime();
      if (!Number.isFinite(ms) || ms < fromMs) continue;
      const key = d.toISOString().slice(0, 10); // yyyy-mm-dd
      const row = map.get(key) ?? { day: key, volumeCfa: 0, commissionCfa: 0, count: 0 };
      row.volumeCfa += Number(t.amountCfa ?? 0) || 0;
      row.commissionCfa += Number(t.commissionAmount ?? 0) || 0;
      row.count += 1;
      map.set(key, row);
    }

    // remplir les jours manquants pour une courbe stable
    const out: Array<{ label: string; volumeCfa: number; commissionCfa: number; count: number }> = [];
    for (let i = 0; i < days; i++) {
      const d = addDays(from, i);
      const key = d.toISOString().slice(0, 10);
      const row = map.get(key);
      out.push({
        label: key.slice(8, 10) + '/' + key.slice(5, 7),
        volumeCfa: row?.volumeCfa ?? 0,
        commissionCfa: row?.commissionCfa ?? 0,
        count: row?.count ?? 0,
      });
    }
    return out;
  }, [txRows, preset]);

  const statusRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of txRows) {
      const s = String(t.status ?? 'UNKNOWN');
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [txRows]);

  return (
    <div className="space-y-10">
      <Card className="relative overflow-hidden p-6 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.10] via-white to-emerald-500/[0.08]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Administration
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-text-dark">
                Tableau de bord
              </h1>
             
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="muted" className="bg-white">
                Live
              </Badge>
              <Badge tone="muted" className="bg-white">
                Données: API v1
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-card" />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Utilisateurs" value={String(k.users)} Icon={Users} tone="slate" />
        <KpiCard
          label="KYC en attente"
          value={String(k.kycPending)}
          Icon={BadgeCheck}
          tone="amber"
          warn={k.kycPending > 0}
        />
        <KpiCard
          label="Transactions actives"
          value={String(k.txActive)}
          Icon={ArrowLeftRight}
          tone="indigo"
          warn={k.txActive > 0}
        />
        <KpiCard
          label="Litiges ouverts"
          value={String(k.disputesOpen)}
          Icon={Scale}
          tone="rose"
          warn={k.disputesOpen > 0}
        />
        <KpiCard
          label="Demandes en attente"
          value={String(k.requestsPending)}
          Icon={Inbox}
          tone="emerald"
          warn={k.requestsPending > 0}
        />
      </div>

      <Card className="relative overflow-hidden p-6 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.10] via-white to-indigo-500/[0.08]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="relative min-w-0">
            <h2 className="font-display text-xl font-semibold text-text-dark">
              Revenus & commissions
            </h2>
            
          </div>

          <div className="relative flex flex-wrap items-center justify-end gap-2">
            <label className="text-xs font-semibold text-text-muted">Période</label>
            <select
              className="input-field-surface"
              value={revPeriod}
              onChange={(e) => setRevPeriod(e.target.value as RevenuePeriod)}
            >
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
              <option value="year">Année</option>
            </select>
          </div>
        </div>

        {revenueQuery.isLoading ? (
          <Skeleton className="mt-4 h-24 w-full rounded-card" />
        ) : revenueQuery.data ? (
          <dl className="relative mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-input border border-primary/10 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Transactions
              </dt>
              <dd className="mt-0.5 font-medium text-text-dark">
                {revenueQuery.data.transactionCount}
              </dd>
            </div>
            <div className="rounded-input border border-primary/10 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Volume total
              </dt>
              <dd className="mt-0.5 font-medium text-text-dark">
                {formatCFA(revenueQuery.data.totalVolumeCfa)}
              </dd>
            </div>
            <div className="rounded-input border border-primary/10 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Commissions
              </dt>
              <dd className="mt-0.5 font-medium text-accent">
                {formatCFA(revenueQuery.data.totalCommissionCfa)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-text-muted">
            Synthèse indisponible pour le moment.
          </p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="relative overflow-hidden p-6 shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.10] via-white to-white" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <h2 className="font-display text-lg font-semibold text-text-dark">
                Volume & commissions (tendance)
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                Basé sur les dernières transactions chargées (<InlineCode>GET /api/v1/admin/transactions</InlineCode>)
              </p>
            </div>
            <div className="relative flex flex-wrap gap-2">
              <Button
                variant={preset === '7d' ? 'primary' : 'outline'}
                className="px-4 py-2 text-sm"
                onClick={() => setPreset('7d')}
              >
                7j
              </Button>
              <Button
                variant={preset === '30d' ? 'primary' : 'outline'}
                className="px-4 py-2 text-sm"
                onClick={() => setPreset('30d')}
              >
                30j
              </Button>
              <Button
                variant={preset === '90d' ? 'primary' : 'outline'}
                className="px-4 py-2 text-sm"
                onClick={() => setPreset('90d')}
              >
                90j
              </Button>
            </div>
          </div>

          <div className="relative mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={56} />
                <Tooltip
                  formatter={(v: unknown) =>
                    typeof v === 'number' ? formatCFA(v) : String(v ?? '')
                  }
                />
                <Line
                  type="monotone"
                  dataKey="volumeCfa"
                  stroke="rgb(79 70 229)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="commissionCfa"
                  stroke="rgb(236 72 153)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="relative mt-4 flex items-center justify-between">
            <Badge tone="muted" className="bg-white">
              <TrendingUp className="mr-1 h-3.5 w-3.5" /> tendances
            </Badge>
            <Link href="/admin/transactions" className="text-sm font-semibold text-primary hover:underline">
              Voir toutes les transactions →
            </Link>
          </div>
        </Card>

        <Card className="relative overflow-hidden p-6 shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/[0.10] via-white to-white" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <h2 className="font-display text-lg font-semibold text-text-dark">
                Répartition des statuts
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                Top statuts (lecture rapide)
              </p>
            </div>
            <Badge tone="muted" className="bg-white">
              {txRows.length} tx
            </Badge>
          </div>

          <div className="relative mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} width={40} />
                <Tooltip />
                <Bar dataKey="count" fill="rgb(31 58 95)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="relative mt-4 flex items-center justify-between">
            <Badge tone="muted" className="bg-white">
              <Coins className="mr-1 h-3.5 w-3.5" /> distribution
            </Badge>
            <Link href="/admin/transactions" className="text-sm font-semibold text-primary hover:underline">
              Ouvrir la vue transactions →
            </Link>
          </div>
        </Card>
      </div>

      <Card className="p-6 shadow-lg">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-text-dark">
              KYC en attente
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Traitement détaillé sur la page dédiée.
            </p>
          </div>
          <Link
            href="/admin/kyc"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Vérifications KYC →
          </Link>
        </div>
        {kycLoading ? (
          <Skeleton className="h-24 w-full rounded-card" />
        ) : (
          <AdminKycPendingList pending={pendingKyc} compact />
        )}
      </Card>
    </div>
  );
}
