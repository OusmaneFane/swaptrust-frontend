'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { AdminKycPendingList } from '@/components/admin/AdminKycPendingList';
import { adminApi } from '@/services/api';

export default function AdminKycPage() {
  const { data: pendingKyc = [], isLoading } = useQuery({
    queryKey: ['admin', 'kyc', 'pending'],
    queryFn: () => adminApi.kycPending(),
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-ink-muted">
          <Link
            href="/admin"
            className="text-primary transition-colors hover:text-primary-dark"
          >
            ← Tableau de bord
          </Link>
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
          Vérifications d’identité
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-secondary">
          Dossiers en attente (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
            GET /admin/kyc/pending
          </code>
          ). Approuvez ou rejetez après contrôle. Les liens ouvrent les fichiers si
          l’API expose des URLs signées.
        </p>
      </div>

      <Card className="border-line/90 p-6 shadow-card-lg">
        <h2 className="mb-6 font-display text-xl font-semibold text-ink">
          Dossiers à traiter
          <span className="ml-2 inline-flex h-7 min-w-7 items-center justify-center rounded-pill bg-primary/12 px-2 text-sm font-bold text-primary">
            {pendingKyc.length}
          </span>
        </h2>
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-card" />
        ) : (
          <AdminKycPendingList pending={pendingKyc} />
        )}
      </Card>
    </div>
  );
}
