'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { AdminKycPendingList } from '@/components/admin/AdminKycPendingList';
import { adminApi } from '@/services/api';
import { cn, formatCFA } from '@/lib/utils';

function InlineCode({ children }: { children: string }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-ink-secondary">
      {children}
    </code>
  );
}

export default function AdminDashboardPage() {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.dashboard(),
  });

  const { data: pendingKyc = [], isLoading: kycLoading } = useQuery({
    queryKey: ['admin', 'kyc', 'pending'],
    queryFn: () => adminApi.kycPending(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  const k = kpis ?? {
    todayTransactions: 0,
    totalVolumeCfa: 0,
    newUsersToday: 0,
    openDisputes: 0,
    completionRate: 0,
    totalUsers: 0,
  };

  const completionLabel =
    k.completionRate == null || Number.isNaN(k.completionRate)
      ? '—'
      : k.completionRate <= 1
        ? `${(k.completionRate * 100).toFixed(1)}%`
        : `${Number(k.completionRate).toFixed(1)}%`;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Tableau de bord
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-secondary">
          Vue d’ensemble de la plateforme. Les clients gèrent l’escrow seuls ; vous
          suivez les indicateurs (<InlineCode>GET /admin/dashboard</InlineCode>) et les
          transactions (<InlineCode>GET /admin/transactions</InlineCode>) en lecture
          seule, hors
          litiges et KYC.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Échanges (période)', value: String(k.todayTransactions) },
          { label: 'Volume CFA', value: formatCFA(k.totalVolumeCfa) },
          { label: 'Taux de complétion', value: completionLabel },
          { label: 'Utilisateurs (total)', value: String(k.totalUsers) },
          { label: 'Nouveaux (jour)', value: String(k.newUsersToday) },
          {
            label: 'Litiges ouverts',
            value: String(k.openDisputes),
            warn: k.openDisputes > 0,
          },
        ].map((item) => (
          <Card
            key={item.label}
            className={cn(
              'border-line/90 p-5 transition-shadow hover:shadow-card-lg',
              item.warn && 'border-warning/40 bg-warning/5 ring-1 ring-warning/20',
            )}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {item.label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-ink">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card className="border-line/90 p-6 shadow-card-lg">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              KYC en attente
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
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
