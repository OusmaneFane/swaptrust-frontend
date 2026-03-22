'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/services/api';
import { OrderCard } from '@/components/exchange/OrderCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

export default function OrderMatchesPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data: matches, isLoading } = useQuery({
    queryKey: ['orders', id, 'matches'],
    queryFn: () => ordersApi.getMatches(id),
    enabled: Number.isFinite(id),
  });

  return (
    <div className="mx-auto max-w-lg space-y-6 lg:max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">Offres compatibles</h1>
        <Link href={`/ordres/${id}`}>
          <Button type="button" variant="outline" className="text-sm">
            Fiche ordre #{id}
          </Button>
        </Link>
      </div>
      <p className="text-sm text-ink-muted">
        Ordres suggérés par l’API pour votre offre #{id}. Ouvrez une fiche pour lancer
        une transaction avec <strong>votre</strong> ordre complémentaire actif (CFA ↔
        RUB) via{' '}
        <code className="rounded bg-muted px-1 font-mono text-xs text-primary">
          POST /transactions
        </code>
        .
      </p>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-card" />
          <Skeleton className="h-28 w-full rounded-card" />
        </div>
      ) : matches?.length ? (
        <ul className="space-y-3">
          {matches.map((o) => (
            <li key={o.id}>
              <OrderCard order={o} variant="market" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-sm text-ink-muted">
          Aucune offre compatible pour le moment — consultez le{' '}
          <Link href="/ordres" className="font-medium text-primary hover:underline">
            marché
          </Link>
          .
        </p>
      )}
    </div>
  );
}
