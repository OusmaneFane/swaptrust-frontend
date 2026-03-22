'use client';

import { useState, useRef, useCallback } from 'react';
import { useOrdersInfinite } from '@/hooks/useOrders';
import { OrderCard } from '@/components/exchange/OrderCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { PaymentMethod, OrderType } from '@/types';

/**
 * Marché public : uniquement ordres ACTIVE (hors les vôtres — filtré par l’API).
 * Les ordres IN_PROGRESS ne sont pas listés ici.
 */
export default function OrdresPage() {
  const [type, setType] = useState<OrderType | ''>('');
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [currencyFrom, setCurrencyFrom] = useState<'XOF' | 'RUB' | ''>('');
  const [currencyTo, setCurrencyTo] = useState<'XOF' | 'RUB' | ''>('');
  const touchStart = useRef(0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useOrdersInfinite({
      status: 'ACTIVE',
      ...(type ? { type } : {}),
      ...(method ? { paymentMethod: method } : {}),
      ...(currencyFrom ? { currencyFrom } : {}),
      ...(currencyTo ? { currencyTo } : {}),
    });

  const orders = data?.pages.flatMap((p) => p.items) ?? [];

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.touches[0]?.clientY ?? 0;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const y = e.changedTouches[0]?.clientY ?? 0;
      if (y - touchStart.current > 80) void refetch();
    },
    [refetch],
  );

  return (
    <div
      className="mx-auto max-w-lg space-y-6 lg:max-w-3xl"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Marché des ordres</h1>
          <p className="mt-1 text-xs text-ink-muted">
            Offres <strong>actives</strong> uniquement — les vôtres sont exclues par
            l’API. Un ordre disparaît dès qu’une transaction le verrouille (
            <strong>en cours</strong>).
          </p>
        </div>
        <Link href="/ordres/creer">
          <Button type="button" className="py-2 text-sm">
            Publier un ordre
          </Button>
        </Link>
      </div>
      <p className="text-xs text-ink-faint">
        Tirer vers le bas sur mobile pour rafraîchir (pull approximatif).
      </p>

      <div className="rounded-input border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-ink-secondary">
        Montants, taux, moyen de paiement et note sont visibles ; les{' '}
        <strong className="text-ink">numéros de téléphone</strong> restent masqués
        jusqu’au lancement d’une transaction avec un ordre complémentaire (CFA ↔ RUB).
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className="input-field max-w-[160px] py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as OrderType | '')}
        >
          <option value="">Type</option>
          <option value="SEND_CFA">CFA → RUB</option>
          <option value="SEND_RUB">RUB → CFA</option>
        </select>
        <select
          className="input-field max-w-[180px] py-2 text-sm"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod | '')}
        >
          <option value="">Moyen</option>
          <option value="ORANGE_MONEY">Orange Money</option>
          <option value="WAVE">Wave</option>
          <option value="SBP">SBP</option>
          <option value="BANK_TRANSFER">Virement</option>
        </select>
        <select
          className="input-field max-w-[120px] py-2 text-sm"
          value={currencyFrom}
          onChange={(e) => setCurrencyFrom(e.target.value as 'XOF' | 'RUB' | '')}
        >
          <option value="">Dev. envoi</option>
          <option value="XOF">XOF</option>
          <option value="RUB">RUB</option>
        </select>
        <select
          className="input-field max-w-[120px] py-2 text-sm"
          value={currencyTo}
          onChange={(e) => setCurrencyTo(e.target.value as 'XOF' | 'RUB' | '')}
        >
          <option value="">Dev. récep.</option>
          <option value="XOF">XOF</option>
          <option value="RUB">RUB</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-card" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <OrderCard order={o} variant="market" />
            </li>
          ))}
        </ul>
      )}

      {hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          loading={isFetchingNextPage}
          onClick={() => void fetchNextPage()}
        >
          Charger plus
        </Button>
      ) : null}
    </div>
  );
}
