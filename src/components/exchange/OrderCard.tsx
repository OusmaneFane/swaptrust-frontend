'use client';

import Link from 'next/link';
import type { Order, OrderStatus } from '@/types';
import { formatCFA, formatRUB, fromNow } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const methodLabels: Record<string, string> = {
  ORANGE_MONEY: 'Orange Money',
  WAVE: 'Wave',
  BANK_TRANSFER: 'Virement',
  SBP: 'SBP',
  OTHER: 'Autre',
};

/** Libellés côté client (sans mention « opérateur »). */
const ORDER_STATUS_CLIENT: Record<
  OrderStatus,
  { label: string; tone: 'default' | 'success' | 'warning' | 'danger' | 'muted' }
> = {
  ACTIVE: { label: 'En attente de traitement', tone: 'warning' },
  MATCHED: { label: 'Échange en préparation', tone: 'default' },
  IN_PROGRESS: { label: 'Transfert en cours', tone: 'default' },
  COMPLETED: { label: 'Échange terminé', tone: 'success' },
  CANCELLED: { label: 'Annulé', tone: 'danger' },
  DISPUTED: { label: 'Litige ouvert', tone: 'danger' },
};

type Props = {
  order: Order;
  /** Marché public : téléphone masqué, lien vers la fiche ordre. */
  variant?: 'market' | 'default';
  href?: string;
  className?: string;
  /** Affiche le statut avec libellés compréhensibles pour le client. */
  showClientStatus?: boolean;
};

export function OrderCard({
  order,
  variant = 'default',
  href,
  className,
  showClientStatus = false,
}: Props) {
  const isCfa = order.type === 'SEND_CFA';
  const isMarket = variant === 'market';
  const to = href ?? `/ordres/${order.id}`;
  const statusMeta = ORDER_STATUS_CLIENT[order.status];

  return (
    <Link
      href={to}
      className={cn(
        'glass-card block p-4 transition-all hover:border-primary/35 hover:shadow-card-lg active:scale-[0.99]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={order.user.avatar} name={order.user.name} size="md" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{order.user.name}</p>
            <p className="text-xs text-ink-muted">
              {isCfa ? 'Envoie des CFA' : 'Envoie des roubles'} ·{' '}
              {fromNow(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone="muted">
            {methodLabels[order.paymentMethod] ?? order.paymentMethod}
          </Badge>
          {showClientStatus ? (
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-ink-faint">Vous recevez</p>
          <p className="font-display text-xl font-bold text-ink">
            {isCfa ? formatRUB(order.amountTo) : formatCFA(order.amountTo)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-faint">Taux</p>
          <p className="text-sm font-semibold text-primary">
            {Number.isFinite(order.rate) ? order.rate.toFixed(4) : '—'}
          </p>
        </div>
      </div>
      {order.note ? (
        <p className="mt-3 line-clamp-2 border-t border-line/80 pt-3 text-xs text-ink-secondary">
          <span className="font-medium text-ink-muted">Note :</span> {order.note}
        </p>
      ) : null}
      {isMarket ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
          <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          Numéro masqué jusqu’à la transaction
        </p>
      ) : order.phoneReceive ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-secondary">
          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {order.phoneReceive}
        </p>
      ) : null}
    </Link>
  );
}
