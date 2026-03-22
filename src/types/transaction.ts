import type { User } from './user';

/** Filtre GET /transactions — `direction` côté API. */
export type TransactionListDirection = 'sent' | 'received';

export type TransactionStatus =
  | 'INITIATED'
  | 'SENDER_SENT'
  | 'RECEIVER_CONFIRMED'
  | 'RUB_SENT'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export interface Transaction {
  id: number;
  orderId: number;
  sender: User;
  receiver: User;
  amountCfa: number;
  amountRub: number;
  rate: number;
  commissionAmount: number;
  status: TransactionStatus;
  proofUrl: string | null;
  initiatedAt: string;
  completedAt: string | null;
  expiresAt: string;
}

export const TRANSACTION_STEPS: Record<
  TransactionStatus,
  { label: string; description: string; step: number }
> = {
  INITIATED: {
    step: 1,
    label: 'Échange initié',
    description: 'Les deux parties ont accepté',
  },
  SENDER_SENT: {
    step: 2,
    label: 'Paiement envoyé',
    description: 'En attente de confirmation',
  },
  RECEIVER_CONFIRMED: {
    step: 3,
    label: 'Réception confirmée',
    description: 'Les CFA ont bien été reçus',
  },
  RUB_SENT: {
    step: 4,
    label: 'Roubles envoyés',
    description: 'En attente de confirmation',
  },
  COMPLETED: {
    step: 5,
    label: 'Transaction complète',
    description: '🎉 Échange réussi !',
  },
  DISPUTED: {
    step: -1,
    label: 'Litige ouvert',
    description: 'Un admin va intervenir',
  },
  CANCELLED: {
    step: -1,
    label: 'Annulée',
    description: 'Transaction annulée',
  },
};
