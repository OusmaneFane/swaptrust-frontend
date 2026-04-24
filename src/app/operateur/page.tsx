'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Coins, CreditCard, LineChart as LineChartIcon, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { operatorApi } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCFA, formatRUB, fromNow } from '@/lib/utils';
import { TRANSACTION_STEPS } from '@/types/transaction';
import { UrgencyBadge } from '@/components/operator/UrgencyBadge';
import { TakeRequestModal } from '@/components/operator/TakeRequestModal';
import type { ExchangeRequest } from '@/types';

const MAX_CONCURRENT = 5;
type PeriodPreset = 'today' | 'month' | 'year' | 'all';

function toneClasses(tone: 'indigo' | 'emerald' | 'rose' | 'amber') {
  switch (tone) {
    case 'indigo':
      return {
        wrap: 'bg-gradient-to-br from-indigo-500/[0.16] via-white to-white',
        icon: 'bg-indigo-500/[0.12] text-indigo-700 ring-indigo-500/15',
      };
    case 'emerald':
      return {
        wrap: 'bg-gradient-to-br from-emerald-500/[0.16] via-white to-white',
        icon: 'bg-emerald-500/[0.12] text-emerald-700 ring-emerald-500/15',
      };
    case 'rose':
      return {
        wrap: 'bg-gradient-to-br from-rose-500/[0.14] via-white to-white',
        icon: 'bg-rose-500/[0.12] text-rose-700 ring-rose-500/15',
      };
    case 'amber':
      return {
        wrap: 'bg-gradient-to-br from-amber-500/[0.16] via-white to-white',
        icon: 'bg-amber-500/[0.14] text-amber-800 ring-amber-500/15',
      };
  }
}

function KpiCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: 'indigo' | 'emerald' | 'rose' | 'amber';
  icon: React.ReactNode;
}) {
  const t = toneClasses(tone);
  return (
    <div
      className={`group relative overflow-hidden rounded-card border border-primary/10 p-4 shadow-sm transition hover:shadow-lg ${t.wrap}`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/[0.06] blur-2xl transition group-hover:bg-primary/[0.09]" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {label}
          </p>
          <p className="mt-1 truncate font-display text-2xl font-bold text-text-dark">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-text-muted">{hint}</p>
          ) : null}
        </div>
        <span
          className={`grid h-10 w-10 place-items-center rounded-2xl ring-1 shadow-sm ${t.icon}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

function txDateIso(t: { takenAt?: string | null; clientSentAt?: string | null; operatorSentAt?: string | null; completedAt?: string | null; expiresAt: string }): string {
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

function startOfMonth(d: Date): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfYear(d: Date): Date {
  const x = new Date(d);
  x.setMonth(0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function monthRange(monthValue: string): { from: Date; to: Date } | null {
  if (!monthValue) return null;
  const [yStr, mStr] = monthValue.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;
  const from = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const to = new Date(y, m, 1, 0, 0, 0, 0);
  return { from, to };
}

export default function OperateurDashboardPage() {
  const [takeRequest, setTakeRequest] = useState<ExchangeRequest | null>(null);
  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [month, setMonth] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [cumulative, setCumulative] = useState(false);

  const { data: pending = [], isLoading: loadPending } = useQuery({
    queryKey: ['operator', 'requests'],
    queryFn: () => operatorApi.getPendingRequests(),
    refetchInterval: 30_000,
  });

  const { data: myTx = [], isLoading: loadTx } = useQuery({
    queryKey: ['operator', 'transactions'],
    queryFn: () => operatorApi.getMyTransactions(),
    refetchInterval: 15_000,
  });

  const sortedPending = [...pending].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const openTx = myTx.filter(
    (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED',
  );
  const atLimit = openTx.length >= MAX_CONCURRENT;

  const dateRange = useMemo(() => {
    const now = new Date();
    if (preset === 'today') {
      const from = startOfDay(now);
      return { from, to: addDays(from, 1) };
    }
    if (preset === 'month') {
      const from = startOfMonth(now);
      const to = new Date(from);
      to.setMonth(from.getMonth() + 1);
      return { from, to };
    }
    if (preset === 'year') {
      const from = startOfYear(now);
      const to = new Date(from);
      to.setFullYear(from.getFullYear() + 1);
      return { from, to };
    }
    return null;
  }, [preset]);

  const monthOverride = useMemo(() => monthRange(month), [month]);

  const filteredTx = useMemo(() => {
    const range = monthOverride ?? dateRange;
    const fromMs = range ? range.from.getTime() : null;
    const toMs = range ? range.to.getTime() : null;

    return myTx.filter((t) => {
      if (status && t.status !== status) return false;
      if (fromMs != null && toMs != null) {
        const ms = new Date(txDateIso(t)).getTime();
        if (!Number.isFinite(ms)) return false;
        if (ms < fromMs || ms >= toMs) return false;
      }
      return true;
    });
  }, [myTx, dateRange, monthOverride, status]);

  const totals = useMemo(() => {
    let volumeCfa = 0;
    let commissionCfa = 0;
    let open = 0;
    let completed = 0;
    for (const t of filteredTx) {
      volumeCfa += Number(t.amountCfa ?? 0) || 0;
      commissionCfa += Number(t.commissionAmount ?? 0) || 0;
      if (t.status === 'COMPLETED') completed += 1;
      if (t.status !== 'COMPLETED' && t.status !== 'CANCELLED') open += 1;
    }
    return {
      count: filteredTx.length,
      open,
      completed,
      volumeCfa,
      commissionCfa,
      netApprox: Math.max(0, volumeCfa - commissionCfa),
    };
  }, [filteredTx]);

  const dailyChart = useMemo(() => {
    const map = new Map<string, { day: string; volumeCfa: number; commissionCfa: number; count: number }>();
    for (const t of filteredTx) {
      const d = new Date(txDateIso(t));
      if (Number.isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      const row = map.get(key) ?? { day: key, volumeCfa: 0, commissionCfa: 0, count: 0 };
      row.volumeCfa += Number(t.amountCfa ?? 0) || 0;
      row.commissionCfa += Number(t.commissionAmount ?? 0) || 0;
      row.count += 1;
      map.set(key, row);
    }
    const daily = Array.from(map.values())
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((r) => ({
        ...r,
        label: r.day.slice(8, 10) + '/' + r.day.slice(5, 7),
      }));
    let cumVol = 0;
    let cumCom = 0;
    return daily.map((r) => {
      cumVol += r.volumeCfa;
      cumCom += r.commissionCfa;
      return { ...r, cumVolumeCfa: cumVol, cumCommissionCfa: cumCom };
    });
  }, [filteredTx]);

  const statusChart = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of filteredTx) {
      counts.set(t.status, (counts.get(t.status) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([s, count]) => ({ status: s, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredTx]);

  function statusSummary(status: string): string {
    switch (status) {
      case 'INITIATED':
        return 'En attente du reçu client';
      case 'CLIENT_SENT':
        return 'Reçu client à vérifier';
      case 'OPERATOR_VERIFIED':
        return 'Reçu validé — à envoyer';
      case 'OPERATOR_SENT':
        return 'En attente confirmation client';
      default:
        return TRANSACTION_STEPS[status as keyof typeof TRANSACTION_STEPS]?.label ?? status;
    }
  }

  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden border border-primary/10 bg-gradient-to-br from-primary/[0.10] via-white to-white p-6 shadow-lg">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/[0.18] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/[0.16] blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Tableau de bord opérateur
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold text-text-dark md:text-3xl">
              Décisions rapides, stats claires
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary">
              Suivi de vos transactions, commissions et tendances — avec des filtres rapides.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/operateur/transactions"
              className="rounded-pill border border-primary/15 bg-white px-4 py-2 text-sm font-semibold text-text-dark shadow-sm transition hover:bg-primary/[0.04]"
            >
              Voir toutes mes transactions
            </Link>
            <Link
              href="/operateur/nouvelle-transaction"
              className="rounded-pill border border-primary/15 bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Nouvelle transaction
            </Link>
          </div>
        </div>
      </Card>

      <Card className="relative overflow-hidden p-5 shadow-lg">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-rose-500/[0.16] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-500/[0.16] blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="rounded-card border border-primary/10 bg-white/80 p-2 shadow-sm backdrop-blur">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={preset === 'today' ? 'primary' : 'outline'}
                className="rounded-pill px-4 py-2 text-sm"
                onClick={() => {
                  setMonth('');
                  setPreset('today');
                }}
              >
                Aujourd’hui
              </Button>
              <Button
                variant={preset === 'month' ? 'primary' : 'outline'}
                className="rounded-pill px-4 py-2 text-sm"
                onClick={() => {
                  setMonth('');
                  setPreset('month');
                }}
              >
                Ce mois
              </Button>
              <Button
                variant={preset === 'year' ? 'primary' : 'outline'}
                className="rounded-pill px-4 py-2 text-sm"
                onClick={() => {
                  setMonth('');
                  setPreset('year');
                }}
              >
                Cette année
              </Button>
              <Button
                variant={preset === 'all' ? 'primary' : 'outline'}
                className="rounded-pill px-4 py-2 text-sm"
                onClick={() => {
                  setMonth('');
                  setPreset('all');
                }}
              >
                Tout
              </Button>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[680px] lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-dark">
                Mois (optionnel)
              </label>
              <input
                type="month"
                className="input-field-surface w-full"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              <p className="mt-1 text-xs text-text-muted">
                Si renseigné, ce filtre prime sur Aujourd’hui / Mois / Année.
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-dark">
                Statut
              </label>
              <select
                className="input-field-surface w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="INITIATED">Assigné</option>
                <option value="CLIENT_SENT">Reçu client</option>
                <option value="OPERATOR_VERIFIED">Reçu validé</option>
                <option value="OPERATOR_SENT">Envoyé</option>
                <option value="COMPLETED">Terminé</option>
                <option value="DISPUTED">Litige</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <label className="inline-flex w-full cursor-pointer items-center justify-between gap-3 rounded-input border border-primary/10 bg-white px-4 py-3 text-sm text-text-secondary shadow-sm">
                <span className="font-semibold text-text-dark">Courbes cumulées</span>
                <input
                  type="checkbox"
                  className="rounded border-primary/20"
                  checked={cumulative}
                  onChange={(e) => setCumulative(e.target.checked)}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="relative mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Transactions (filtrées)"
            value={String(totals.count)}
            hint={`En cours: ${totals.open} · Terminées: ${totals.completed}`}
            tone="indigo"
            icon={<LineChartIcon className="h-5 w-5" />}
          />
          <KpiCard
            label="Volume (CFA)"
            value={formatCFA(totals.volumeCfa)}
            tone="emerald"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <KpiCard
            label="Commissions (CFA)"
            value={formatCFA(totals.commissionCfa)}
            tone="rose"
            icon={<Coins className="h-5 w-5" />}
          />
          <KpiCard
            label="Net approx. (CFA)"
            value={formatCFA(totals.netApprox)}
            hint="Net approx = Volume − Commission"
            tone="amber"
            icon={<CreditCard className="h-5 w-5" />}
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Card className="border border-primary/10 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-dark">
                {cumulative ? 'Volume cumulé' : 'Volume (jour)'}
              </p>
              <span className="rounded-pill border border-primary/10 bg-white px-2.5 py-0.5 text-xs font-semibold text-text-muted shadow-sm">
                CFA
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyChart}>
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
                    dataKey={cumulative ? 'cumVolumeCfa' : 'volumeCfa'}
                    stroke="rgb(79 70 229)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border border-primary/10 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-dark">
                {cumulative ? 'Commissions cumulées' : 'Commissions (jour)'}
              </p>
              <span className="rounded-pill border border-primary/10 bg-white px-2.5 py-0.5 text-xs font-semibold text-text-muted shadow-sm">
                CFA
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={56} />
                  <Tooltip
                    formatter={(v: unknown) =>
                      typeof v === 'number' ? formatCFA(v) : String(v ?? '')
                    }
                  />
                  <Bar
                    dataKey={cumulative ? 'cumCommissionCfa' : 'commissionCfa'}
                    fill="rgb(236 72 153)"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="mt-5">
          <Card className="border border-primary/10 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-dark">
                Répartition des statuts (filtrés)
              </p>
              <span className="rounded-pill border border-primary/10 bg-white px-2.5 py-0.5 text-xs font-semibold text-text-muted shadow-sm">
                {filteredTx.length} tx
              </span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} width={40} />
                  <Tooltip />
                  <Bar dataKey="count" fill="rgb(31 58 95)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-text-dark">
              Dernières transactions (filtrées)
            </h2>
            <Link
              href="/operateur/transactions"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ouvrir la liste →
            </Link>
          </div>
          <div className="overflow-hidden rounded-card border border-primary/10 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="border-b border-primary/10 bg-white/70 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="p-4 font-medium">ID</th>
                    <th className="p-4 font-medium">Client</th>
                    <th className="p-4 font-medium">CFA</th>
                    <th className="p-4 font-medium">Commission</th>
                    <th className="p-4 font-medium">RUB</th>
                    <th className="p-4 font-medium">Statut</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Détail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10 bg-white">
                  {filteredTx
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(txDateIso(b)).getTime() - new Date(txDateIso(a)).getTime(),
                    )
                    .slice(0, 10)
                    .map((t) => (
                      <tr key={t.id} className="transition-colors hover:bg-primary/[0.04]">
                        <td className="p-4 font-semibold text-text-dark">#{t.id}</td>
                        <td className="p-4 text-text-secondary">{t.client.name}</td>
                        <td className="p-4 font-medium text-text-dark">{formatCFA(t.amountCfa)}</td>
                        <td className="p-4 font-medium text-accent">
                          {formatCFA(Number(t.commissionAmount ?? 0) || 0)}
                        </td>
                        <td className="p-4 font-medium text-text-dark">{formatRUB(t.amountRub)}</td>
                        <td className="p-4">
                          <span className="rounded-pill border border-primary/10 bg-white px-2.5 py-0.5 text-xs font-semibold text-text-secondary shadow-sm">
                            {TRANSACTION_STEPS[t.status]?.label ?? t.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-text-muted">
                          {t.takenAt ? fromNow(t.takenAt) : '—'}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/operateur/transactions/${t.id}`}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Ouvrir →
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-primary/10 md:hidden">
              {filteredTx
                .slice()
                .sort((a, b) => new Date(txDateIso(b)).getTime() - new Date(txDateIso(a)).getTime())
                .slice(0, 8)
                .map((t) => (
                  <Link
                    key={t.id}
                    href={`/operateur/transactions/${t.id}`}
                    className="block p-4 transition hover:bg-primary/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-text-dark">#{t.id}</p>
                        <p className="mt-0.5 truncate text-sm text-text-secondary">
                          {t.client.name}
                        </p>
                      </div>
                      <span className="rounded-pill border border-primary/10 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary shadow-sm">
                        {TRANSACTION_STEPS[t.status]?.label ?? t.status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-card border border-primary/10 bg-white p-2 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                          CFA
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-text-dark">
                          {formatCFA(t.amountCfa)}
                        </p>
                      </div>
                      <div className="rounded-card border border-primary/10 bg-white p-2 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                          Com
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-accent">
                          {formatCFA(Number(t.commissionAmount ?? 0) || 0)}
                        </p>
                      </div>
                      <div className="rounded-card border border-primary/10 bg-white p-2 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                          RUB
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-text-dark">
                          {formatRUB(t.amountRub)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      {t.takenAt ? fromNow(t.takenAt) : '—'}
                    </p>
                  </Link>
                ))}
            </div>

            {!loadTx && filteredTx.length === 0 ? (
              <p className="p-6 text-center text-sm text-text-muted">
                Aucune transaction pour ces filtres.
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {loadPending ? (
          <>
            <Skeleton className="h-24 rounded-card" />
            <Skeleton className="h-24 rounded-card" />
          </>
        ) : (
          <>
            <Card className="border border-primary/10 p-4 shadow-sm">
              <p className="font-display text-2xl font-bold text-text-dark">
                {pending.length}
              </p>
              <p className="text-sm text-text-muted">Demandes en attente</p>
            </Card>
            <Card className="border border-primary/10 bg-primary/[0.04] p-4 shadow-sm">
              <p className="font-display text-2xl font-bold text-primary">
                {openTx.length}
              </p>
              <p className="text-sm text-text-muted">Transactions en cours</p>
              {atLimit ? (
                <p className="mt-2 text-xs text-warning">
                  Limite de {MAX_CONCURRENT} transactions simultanées atteinte.
                </p>
              ) : null}
            </Card>
          </>
        )}
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-text-dark">
          Nouvelles demandes
        </h2>
        {loadPending ? (
          <Skeleton className="h-32 w-full rounded-card" />
        ) : sortedPending.length ? (
          <ul className="space-y-2">
            {sortedPending.map((r) => (
              <li key={r.id}>
                <Card className="flex flex-col gap-3 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-text-dark">{r.client.name}</p>
                      <span className="text-xs text-text-muted">
                        {fromNow(r.createdAt)}
                      </span>
                      <UrgencyBadge expiresAt={r.expiresAt} />
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {r.type === 'NEED_RUB'
                        ? `Besoin de ${formatRUB(r.amountWanted)} → enverra ${formatCFA(r.amountToSend)}`
                        : `Besoin de ${formatCFA(r.amountWanted)} → enverra ${formatRUB(r.amountToSend)}`}
                    </p>
                    {r.note ? (
                      <p className="mt-1 text-xs italic text-text-muted">« {r.note} »</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    className="shrink-0"
                    disabled={atLimit}
                    onClick={() => setTakeRequest(r)}
                  >
                    {atLimit ? 'Limite atteinte' : 'Prendre en charge'}
                    <ArrowRight className="ml-1 inline h-4 w-4" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="border border-dashed border-primary/15 p-6 text-center text-sm text-text-muted shadow-sm">
            Aucune demande en attente.
          </Card>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-text-dark">
            Mes transactions en cours
          </h2>
          <Link
            href="/operateur/transactions"
            className="text-sm font-medium text-primary hover:underline"
          >
            Tout voir
          </Link>
        </div>
        {loadTx ? (
          <Skeleton className="h-28 w-full rounded-card" />
        ) : openTx.length ? (
          <ul className="space-y-2">
            {openTx.slice(0, 10).map((t) => {
              const step = TRANSACTION_STEPS[t.status];
              const stepLabel =
                step.step > 0 ? `#${t.id} ${t.client.name} — ${statusSummary(t.status)}` : `#${t.id}`;
              return (
                <li key={t.id}>
                  <Link
                    href={`/operateur/transactions/${t.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-primary/10 bg-white p-4 text-sm shadow-sm transition hover:border-primary/25 hover:bg-primary/[0.04]"
                  >
                    <div>
                      <p className="font-medium text-text-dark">{stepLabel}</p>
                      <p className="text-text-muted">
                        {formatCFA(t.amountCfa)} · {formatRUB(t.amountRub)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {t.takenAt ? fromNow(t.takenAt) : '—'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">Aucune transaction ouverte.</p>
        )}
      </section>

      <Modal
        open={takeRequest != null}
        onClose={() => setTakeRequest(null)}
        title="Prendre en charge"
      >
        {takeRequest ? (
          <TakeRequestModal request={takeRequest} onClose={() => setTakeRequest(null)} />
        ) : null}
      </Modal>
    </div>
  );
}
