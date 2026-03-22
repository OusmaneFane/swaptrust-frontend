'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ordersApi, transactionsApi, authApi } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  complementaryOrderType,
  pairOrderIdsForTransaction,
} from '@/lib/order-transaction';
import { sameUserId } from '@/lib/same-user';
import { formatCFA, formatRUB, fromNow } from '@/lib/utils';
import type { Order } from '@/types';

const methodLabels: Record<string, string> = {
  ORANGE_MONEY: 'Orange Money',
  WAVE: 'Wave',
  BANK_TRANSFER: 'Virement',
  SBP: 'SBP',
  OTHER: 'Autre',
};

function isOwnOrder(
  o: Order,
  meId: number | undefined,
  sessionId: string | undefined,
): boolean {
  return sameUserId(o.user.id, meId) || sameUserId(o.user.id, sessionId);
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session } = useSession();
  const id = Number(params.id);
  const [pickedMineId, setPickedMineId] = useState<number | ''>('');

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.getById(id),
    enabled: Number.isFinite(id),
  });

  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
  });

  const canTake =
    Boolean(order && order.status === 'ACTIVE' && !isOwnOrder(order, me?.id, session?.user?.id));

  const { data: mine } = useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: () => ordersApi.mine(),
    enabled: canTake,
  });

  const cancelMut = useMutation({
    mutationFn: (orderId: number) => ordersApi.cancel(orderId),
    onSuccess: () => {
      toast.success('Ordre annulé');
      void qc.invalidateQueries({ queryKey: ['orders'] });
      router.push('/ordres');
    },
    onError: () => toast.error('Annulation impossible'),
  });

  const initiateMut = useMutation({
    mutationFn: transactionsApi.initiate,
    onSuccess: (tx) => {
      toast.success('Échange lancé — ordres verrouillés, chat et étapes disponibles.');
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      router.push(`/transactions/${tx.id}`);
    },
    onError: () =>
      toast.error(
        'Impossible de lancer l’échange. Vérifiez un ordre complémentaire actif (CFA ↔ RUB).',
      ),
  });

  if (!Number.isFinite(id)) {
    return (
      <p className="text-center text-sm text-ink-muted">Ordre introuvable.</p>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 lg:max-w-xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm text-ink-muted">
          Cet ordre n’existe pas, a été pris par un autre pair ou n’est plus actif.
        </p>
        <Link
          href="/ordres"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          ← Retour au marché
        </Link>
      </div>
    );
  }

  const own = isOwnOrder(order, me?.id, session?.user?.id);
  const complementary = complementaryOrderType(order.type);
  const myActiveComplementary =
    mine?.items.filter((o) => o.status === 'ACTIVE' && o.type === complementary) ?? [];

  function submitTake() {
    if (!order) return;
    if (!pickedMineId) {
      toast.error('Choisissez votre ordre complémentaire');
      return;
    }
    const myOrder = myActiveComplementary.find((o) => o.id === pickedMineId);
    if (!myOrder) return;
    const body = pairOrderIdsForTransaction(order, myOrder);
    if (!body) {
      toast.error('Les deux ordres doivent être un envoi CFA et un envoi RUB.');
      return;
    }
    initiateMut.mutate(body);
  }

  const isCfa = order.type === 'SEND_CFA';

  return (
    <div className="mx-auto max-w-lg space-y-6 lg:max-w-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/ordres"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Marché
          </Link>
          <Link
            href={`/ordres/${id}/matches`}
            className="text-sm text-ink-muted hover:text-primary hover:underline"
          >
            Offres compatibles
          </Link>
        </div>
        <Badge
          tone={
            order.status === 'ACTIVE'
              ? 'success'
              : order.status === 'IN_PROGRESS'
                ? 'warning'
                : 'muted'
          }
        >
          {order.status}
        </Badge>
      </div>

      {own ? (
        <Card className="border-primary/20 bg-primary/5">
          <p className="text-sm font-medium text-ink">C’est votre ordre</p>
          <p className="mt-1 text-xs text-ink-muted">
            Tant qu’il est actif, les autres utilisateurs vérifiés peuvent le voir (sans
            votre numéro) et l’associer au leur. Après une transaction, il passe en
            cours et disparaît du marché.
          </p>
        </Card>
      ) : (
        <Card className="border-line bg-surface/50">
          <p className="text-sm text-ink-secondary">
            <strong className="text-ink">Règle d’échange :</strong> pour prendre cet ordre,
            vous devez avoir publié un ordre actif dans l’autre sens (
            {complementary === 'SEND_CFA' ? 'vous envoyez des CFA' : 'vous envoyez des RUB'}
            ). Les deux ordres passeront alors en <strong>en cours</strong> et ne seront
            plus visibles pour les autres ; le numéro sera partagé entre vous deux
            uniquement.
          </p>
        </Card>
      )}

      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Ordre #{order.id}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{fromNow(order.createdAt)}</p>
      </div>

      <Card className="space-y-4 border-line/90 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <Avatar src={order.user.avatar} name={order.user.name} size="lg" />
          <div>
            <p className="font-semibold text-ink">{order.user.name}</p>
            <p className="text-xs text-ink-muted">
              {isCfa ? 'Envoie des CFA' : 'Envoie des roubles'} ·{' '}
              {fromNow(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-ink-faint">Envoie</p>
            <p className="font-semibold text-ink">
              {isCfa ? formatCFA(order.amountFrom) : formatRUB(order.amountFrom)}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-faint">Contrepartie reçue</p>
            <p className="font-semibold text-ink">
              {isCfa ? formatRUB(order.amountTo) : formatCFA(order.amountTo)}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-faint">Moyen de paiement</p>
            <p className="text-sm text-ink">
              {methodLabels[order.paymentMethod] ?? order.paymentMethod}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-faint">Taux</p>
            <p className="text-sm font-semibold text-primary">
              {Number.isFinite(order.rate) ? order.rate.toFixed(4) : '—'}
            </p>
          </div>
        </div>
        {order.note ? (
          <div className="border-t border-line pt-3">
            <p className="text-xs font-medium text-ink-muted">Note du vendeur</p>
            <p className="mt-1 text-sm text-ink-secondary">{order.note}</p>
          </div>
        ) : null}
        {own && order.phoneReceive ? (
          <div className="border-t border-line pt-3">
            <p className="text-xs font-medium text-ink-muted">Numéro (réception)</p>
            <p className="mt-1 text-sm font-medium text-ink">{order.phoneReceive}</p>
          </div>
        ) : null}
        {!own && (
          <p className="flex items-start gap-2 border-t border-line pt-3 text-xs text-ink-faint">
            Téléphone : masqué jusqu’au lancement de la transaction (
            <code className="rounded bg-muted px-1 font-mono text-[10px]">POST /transactions</code>
            ).
          </p>
        )}
      </Card>

      {own && order.status === 'ACTIVE' ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-danger/35 text-danger"
            loading={cancelMut.isPending}
            onClick={() => {
              if (window.confirm('Annuler cet ordre ?')) {
                cancelMut.mutate(order.id);
              }
            }}
          >
            Annuler mon ordre
          </Button>
        </div>
      ) : null}

      {canTake && order.status === 'ACTIVE' ? (
        <Card className="border-primary/25 bg-gradient-to-br from-primary/5 to-card p-5 shadow-card">
          <h2 className="font-display text-lg font-semibold text-ink">
            Lancer l’échange
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Sélectionnez <strong>votre</strong> ordre actif complémentaire, puis validez.
            Les deux ordres seront verrouillés ensemble.
          </p>
          {myActiveComplementary.length ? (
            <>
              <label className="mt-4 block text-xs font-medium text-ink-muted">
                Votre ordre ({complementary === 'SEND_CFA' ? 'CFA → RUB' : 'RUB → CFA'})
              </label>
              <select
                className="input-field mt-1.5 py-2.5 text-sm"
                value={pickedMineId === '' ? '' : String(pickedMineId)}
                onChange={(e) =>
                  setPickedMineId(e.target.value ? Number(e.target.value) : '')
                }
              >
                <option value="">Choisir…</option>
                {myActiveComplementary.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} —{' '}
                    {o.type === 'SEND_CFA'
                      ? formatCFA(o.amountFrom)
                      : formatRUB(o.amountFrom)}{' '}
                    →{' '}
                    {o.type === 'SEND_CFA'
                      ? formatRUB(o.amountTo)
                      : formatCFA(o.amountTo)}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                className="mt-4 w-full shadow-md shadow-primary/20"
                loading={initiateMut.isPending}
                onClick={() => submitTake()}
              >
                Confirmer et lancer la transaction
              </Button>
            </>
          ) : (
            <div className="mt-4 rounded-input border border-dashed border-primary/30 bg-card p-4 text-center">
              <p className="text-sm text-ink-secondary">
                Vous n’avez pas encore d’ordre actif dans l’autre sens.
              </p>
              <Link href="/ordres/creer">
                <Button type="button" className="mt-3">
                  Publier un ordre complémentaire
                </Button>
              </Link>
            </div>
          )}
        </Card>
      ) : null}

      {!own && order.status !== 'ACTIVE' ? (
        <p className="text-center text-sm text-ink-muted">
          Cet ordre n’est plus disponible sur le marché.
        </p>
      ) : null}
    </div>
  );
}
