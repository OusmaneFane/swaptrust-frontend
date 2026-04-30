'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Download, ExternalLink, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { adminApi } from '@/services/api';
import type { Transaction } from '@/types';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCFA, formatRUB, fullDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { parseDecimalLike } from '@/lib/parse-decimal-json';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const statusTone: Record<string, string> = {
  INITIATED: 'text-text-muted',
  CLIENT_SENT: 'text-sky-600',
  OPERATOR_VERIFIED: 'text-primary-dark',
  OPERATOR_SENT: 'text-violet-600',
  COMPLETED: 'text-success',
  DISPUTED: 'text-danger animate-pulse',
  CANCELLED: 'text-danger/80',
};

type PeriodPreset = 'today' | 'month' | 'year' | 'all';

function n(v: unknown): number {
  const x = parseDecimalLike(v);
  return Number.isFinite(x) ? x : 0;
}

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
  // monthValue: "YYYY-MM"
  if (!monthValue) return null;
  const [yStr, mStr] = monthValue.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;
  const from = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const to = new Date(y, m, 1, 0, 0, 0, 0);
  return { from, to };
}

export default function AdminTransactionsPage() {
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [preset, setPreset] = useState<PeriodPreset>('month');
  // Mois optionnel: si vide, les presets (today/month/year/all) s’appliquent.
  const [month, setMonth] = useState<string>('');
  const [operatorId, setOperatorId] = useState<string>('');
  const [cumulative, setCumulative] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'transactions', status],
    queryFn: () => adminApi.transactions(status ? { status } : undefined),
  });

  const operators = useMemo(() => {
    const map = new Map<number, string>();
    for (const t of rows) {
      if (t.operator?.id != null && t.operator?.name) {
        map.set(t.operator.id, t.operator.name);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

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

  const filtered = useMemo(() => {
    const opIdNum = operatorId ? Number(operatorId) : null;
    const range = monthOverride ?? dateRange;
    const fromMs = range ? range.from.getTime() : null;
    const toMs = range ? range.to.getTime() : null;

    return rows.filter((t) => {
      if (opIdNum != null && Number.isFinite(opIdNum)) {
        if (t.operator?.id !== opIdNum) return false;
      }
      if (fromMs != null && toMs != null) {
        const d = new Date(txDateIso(t));
        const ms = d.getTime();
        if (!Number.isFinite(ms)) return false;
        if (ms < fromMs || ms >= toMs) return false;
      }
      return true;
    });
  }, [rows, operatorId, dateRange, monthOverride]);

  const totals = useMemo(() => {
    let volumeCfa = 0;
    let commissionCfa = 0;
    let grossCfa = 0;
    let netCfa = 0;
    let disputed = 0;
    let completed = 0;
    let cancelled = 0;

    for (const t of filtered) {
      volumeCfa += n(t.amountCfa);
      commissionCfa += n(t.commissionAmount);
      grossCfa += n((t as unknown as { grossAmount?: unknown }).grossAmount);
      netCfa += n((t as unknown as { netAmount?: unknown }).netAmount);
      if (t.status === 'DISPUTED') disputed += 1;
      if (t.status === 'COMPLETED') completed += 1;
      if (t.status === 'CANCELLED') cancelled += 1;
    }

    const count = filtered.length;
    const netApprox = Math.max(0, volumeCfa - commissionCfa);
    return {
      count,
      disputed,
      completed,
      cancelled,
      volumeCfa,
      commissionCfa,
      netApprox,
      grossCfa: grossCfa > 0 ? grossCfa : null,
      netCfa: netCfa > 0 ? netCfa : null,
    };
  }, [filtered]);

  const chart = useMemo(() => {
    const map = new Map<string, { day: string; volumeCfa: number; commissionCfa: number; count: number }>();
    for (const t of filtered) {
      const d = new Date(txDateIso(t));
      if (Number.isNaN(d.getTime())) continue;
      const key = format(d, 'yyyy-MM-dd');
      const row = map.get(key) ?? { day: key, volumeCfa: 0, commissionCfa: 0, count: 0 };
      row.volumeCfa += n(t.amountCfa);
      row.commissionCfa += n(t.commissionAmount);
      row.count += 1;
      map.set(key, row);
    }
    const daily = Array.from(map.values())
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((r) => ({
        ...r,
        label: r.day.slice(8, 10) + '/' + r.day.slice(5, 7),
      }));
    let cumVolumeCfa = 0;
    let cumCommissionCfa = 0;
    return daily.map((r) => {
      cumVolumeCfa += r.volumeCfa;
      cumCommissionCfa += r.commissionCfa;
      return { ...r, cumVolumeCfa, cumCommissionCfa };
    });
  }, [filtered]);

  function exportCsv() {
    const rowsToExport = [...filtered].sort((a, b) => {
      const ams = new Date(txDateIso(a)).getTime();
      const bms = new Date(txDateIso(b)).getTime();
      return (Number.isFinite(bms) ? bms : 0) - (Number.isFinite(ams) ? ams : 0);
    });

    const header = [
      'id',
      'date',
      'status',
      'clientName',
      'clientEmail',
      'operatorName',
      'operatorEmail',
      'amountCfa',
      'amountRub',
      'commissionAmount',
    ];

    const esc = (v: unknown) => {
      const s = String(v ?? '');
      if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
      return s;
    };

    const lines = [
      header.join(','),
      ...rowsToExport.map((t) =>
        [
          t.id,
          txDateIso(t),
          t.status,
          t.client?.name ?? '',
          t.client?.email ?? '',
          t.operator?.name ?? '',
          t.operator?.email ?? '',
          t.amountCfa ?? 0,
          t.amountRub ?? 0,
          t.commissionAmount ?? 0,
        ]
          .map(esc)
          .join(','),
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `transactions-admin-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-primary/10 bg-white/80 px-5 py-4 text-sm text-text-secondary shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur">
        <strong className="font-semibold text-text-dark">Surveillance passive.</strong>{' '}
        Suivi des échanges opérateur ↔ client. Cette vue correspond à{' '}
        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
          GET /admin/transactions
        </code>{' '}
        (lecture seule).
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold tracking-tight text-text-dark">
            Transactions
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Stats & commissions séparées, filtres par période / mois / opérateur.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/15 bg-white px-3 py-2 text-xs font-semibold text-text-secondary shadow-sm">
            <input
              type="checkbox"
              className="rounded border-primary/20"
              checked={cumulative}
              onChange={(e) => setCumulative(e.target.checked)}
            />
            Courbes cumulées
          </label>
          <Button
            variant="outline"
            className="gap-2 px-4 py-2 text-sm"
            onClick={() => exportCsv()}
            disabled={!filtered.length}
            title={filtered.length ? 'Exporter le tableau filtré' : 'Aucune donnée à exporter'}
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
          <Badge tone="muted" className="gap-2">
            <Filter className="h-3.5 w-3.5" aria-hidden />
            {filtered.length} / {rows.length}
          </Badge>
        </div>
      </div>

      <Card className="p-5 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={preset === 'today' ? 'primary' : 'outline'}
              className="px-4 py-2 text-sm"
              onClick={() => {
                setMonth('');
                setPreset('today');
              }}
            >
              Aujourd’hui
            </Button>
            <Button
              variant={preset === 'month' ? 'primary' : 'outline'}
              className="px-4 py-2 text-sm"
              onClick={() => {
                setMonth('');
                setPreset('month');
              }}
            >
              Ce mois
            </Button>
            <Button
              variant={preset === 'year' ? 'primary' : 'outline'}
              className="px-4 py-2 text-sm"
              onClick={() => {
                setMonth('');
                setPreset('year');
              }}
            >
              Cette année
            </Button>
            <Button
              variant={preset === 'all' ? 'primary' : 'outline'}
              className="px-4 py-2 text-sm"
              onClick={() => {
                setMonth('');
                setPreset('all');
              }}
            >
              Tout
            </Button>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[520px]">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-dark">
                Mois (optionnel)
              </label>
              <input
                type="month"
                className="input-field-surface w-full"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  // Si un mois est choisi, il devient le filtre principal (override).
                  // Le preset reste visible mais n’est plus la source de la période.
                }}
              />
              <p className="mt-1 text-xs text-text-muted">
                Si renseigné, ce filtre prime sur Aujourd’hui / Mois / Année.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-dark">
                Opérateur
              </label>
              <select
                className="input-field-surface w-full"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
              >
                <option value="">Tous</option>
                {operators.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-card border border-primary/10 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Transactions
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text-dark">
              {totals.count}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Terminées: {totals.completed} · Annulées: {totals.cancelled} · Litiges: {totals.disputed}
            </p>
          </div>
          <div className="rounded-card border border-primary/10 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Volume (CFA)
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text-dark">
              {formatCFA(totals.volumeCfa)}
            </p>
          </div>
          <div className="rounded-card border border-primary/10 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Commissions (CFA)
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-accent">
              {formatCFA(totals.commissionCfa)}
            </p>
          </div>
          <div className="rounded-card border border-primary/10 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Net approx. (CFA)
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text-dark">
              {formatCFA(totals.netApprox)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Net approx = Volume − Commission
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Card className="border border-primary/10 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-dark">
                {cumulative ? 'Volume cumulé' : 'Volume (jour)'}
              </p>
              <Badge tone="muted">CFA</Badge>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={56} />
                  <Tooltip
                    formatter={(v: unknown) =>
                      typeof v === 'number' ? formatCFA(v) : String(v ?? '')
                    }
                    labelFormatter={(l) => `Jour ${l}`}
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
              <Badge tone="muted">CFA</Badge>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={56} />
                  <Tooltip
                    formatter={(v: unknown) =>
                      typeof v === 'number' ? formatCFA(v) : String(v ?? '')
                    }
                    labelFormatter={(l) => `Jour ${l}`}
                  />
                  <Bar
                    dataKey={cumulative ? 'cumCommissionCfa' : 'commissionCfa'}
                    fill="rgb(236 72 153)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Filtre statut (API)
            </p>
            <p className="text-sm text-text-secondary">
              Le statut filtre la liste et les stats ci-dessus.
            </p>
          </div>
          <select
            className="input-field-surface w-full sm:w-auto"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tous statuts</option>
            <option value="INITIATED">Initié</option>
            <option value="CLIENT_SENT">Reçu client</option>
            <option value="OPERATOR_VERIFIED">Reçu validé</option>
            <option value="OPERATOR_SENT">Envoyé par opérateur</option>
            <option value="COMPLETED">Terminé</option>
            <option value="DISPUTED">Litige</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden p-0 shadow-lg">
        {isLoading ? (
          <Skeleton className="m-4 h-48 rounded-card" />
        ) : (
          <>
            <div className="divide-y divide-primary/10 bg-white md:hidden">
              {filtered.map((t: Transaction) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDetail(t)}
                  className="w-full p-4 text-left transition hover:bg-primary/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-text-dark">#{t.id}</p>
                      <p className="mt-0.5 truncate text-sm text-text-secondary">
                        {t.client.name} <span className="text-text-muted">→</span>{' '}
                        {t.operator.name}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {fullDate(t.takenAt ?? t.expiresAt)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-pill border border-primary/10 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary shadow-sm">
                      <span className={cn('font-bold', statusTone[t.status])}>
                        {t.status}
                      </span>
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
                        {formatCFA(n(t.commissionAmount))}
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

                  <div className="mt-3">
                    <Link
                      href={`/operateur/transactions/${t.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      Ouvrir la fiche opérateur
                    </Link>
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-primary/10 bg-white/70 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="p-4 font-medium">ID</th>
                    <th className="p-4 font-medium">Client</th>
                    <th className="p-4 font-medium">Opérateur</th>
                    <th className="p-4 font-medium">CFA</th>
                    <th className="p-4 font-medium">Commission</th>
                    <th className="p-4 font-medium">RUB</th>
                    <th className="p-4 font-medium">Statut</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Pilotage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10 bg-white">
                  {filtered.map((t: Transaction) => (
                    <tr
                      key={t.id}
                      className="cursor-pointer transition-colors hover:bg-primary/[0.04]"
                      onClick={() => setDetail(t)}
                    >
                      <td className="p-4 font-semibold text-text-dark">#{t.id}</td>
                      <td className="p-4 text-text-secondary">{t.client.name}</td>
                      <td className="p-4 text-text-secondary">{t.operator.name}</td>
                      <td className="p-4 font-medium text-text-dark">{formatCFA(t.amountCfa)}</td>
                      <td className="p-4 font-medium text-accent">
                        {formatCFA(n(t.commissionAmount))}
                      </td>
                      <td className="p-4 font-medium text-text-dark">{formatRUB(t.amountRub)}</td>
                      <td className={cn('p-4 text-xs font-bold', statusTone[t.status])}>
                        {t.status}
                      </td>
                      <td className="p-4 text-xs text-text-muted">
                        {fullDate(t.takenAt ?? t.expiresAt)}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/operateur/transactions/${t.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          Opérateur
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {!isLoading && !filtered.length ? (
          <p className="p-8 text-center text-sm text-text-muted">Aucune transaction.</p>
        ) : null}
      </Card>

      <BottomSheet
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Transaction #${detail.id}` : ''}
      >
        {detail ? (
          <div className="space-y-3 text-sm text-text-secondary">
            <p className="font-display text-lg font-semibold text-text-dark">
              {formatCFA(detail.amountCfa)} ↔ {formatRUB(detail.amountRub)}
            </p>
            <p className="text-sm">
              Commission :{' '}
              <span className="font-semibold text-accent">
                {formatCFA(n(detail.commissionAmount))}
              </span>
            </p>
            <p>Preuve client : {detail.clientProofUrl ?? '—'}</p>
            <p>Preuve opérateur : {detail.operatorProofUrl ?? '—'}</p>
            <p>
              Statut :{' '}
              <span className={cn('font-semibold', statusTone[detail.status])}>
                {detail.status}
              </span>
            </p>
            <p className="text-xs text-text-muted">
              Aucune action admin sur ce flux — observation uniquement.
            </p>
            <Link
              href={`/operateur/transactions/${detail.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-pill border border-primary/30 bg-primary/10 py-3 text-sm font-semibold text-primary hover:bg-primary/15"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Ouvrir la fiche opérateur (actions)
            </Link>
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
