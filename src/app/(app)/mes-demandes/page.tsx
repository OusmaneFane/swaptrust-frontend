'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { requestsApi } from '@/services/api';
import { RequestCard } from '@/components/exchange/RequestCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

export default function MesDemandesPage() {
  const { data: items = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['requests', 'mine'],
    queryFn: () => requestsApi.mine(),
  });

  return (
    <div className="mx-auto max-w-lg space-y-6 lg:max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Mes demandes</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Publications en attente d’un opérateur ou liées à une transaction.
          </p>
        </div>
        <Link href="/demandes/nouvelle">
          <Button type="button" className="py-2 text-sm">
            <Plus className="mr-1.5 inline h-4 w-4" />
            Nouvelle demande
          </Button>
        </Link>
      </div>

      {isError ? (
        <div className="glass-card rounded-card border border-danger/25 bg-danger/5 p-6 text-center">
          <p className="text-sm font-medium text-danger">
            Impossible de charger vos demandes.
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {error instanceof Error ? error.message : 'Erreur réseau ou serveur.'}
          </p>
          <Button
            type="button"
            className="mt-4"
            variant="outline"
            loading={isFetching}
            onClick={() => void refetch()}
          >
            Réessayer
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-card" />
          ))}
        </div>
      ) : items.length ? (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id}>
              <RequestCard request={r} showStatus href={`/demandes/${r.id}`} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="glass-card rounded-card border border-dashed border-primary/25 p-8 text-center">
          <p className="text-sm font-medium text-ink">Aucune demande pour le moment</p>
          <p className="mt-1 text-sm text-ink-muted">
            Indiquez le montant dont vous avez besoin ; un opérateur vous guidera pour la suite.
          </p>
          <Link href="/demandes/nouvelle" className="btn-primary mt-4 inline-flex">
            Nouvelle demande
          </Link>
        </div>
      )}
    </div>
  );
}
