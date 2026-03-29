import type { User } from './user';

export type TransactionStatus =
  | 'INITIATED'
  | 'CLIENT_SENT'
  | 'OPERATOR_VERIFIED'
  | 'OPERATOR_SENT'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export interface Transaction {
  id: number;
  requestId: number;
  client: User;
  operator: User;
  amountCfa: number;
  amountRub: number;
  rate: number;
  commissionAmount: number;
  status: TransactionStatus;
  clientProofUrl: string | null;
  operatorProofUrl: string | null;
  operatorPaymentNumber: string | null;
  clientReceiveNumber: string | null;
  operatorNote: string | null;
  takenAt: string | null;
  clientSentAt: string | null;
  operatorSentAt: string | null;
  completedAt: string | null;
  expiresAt: string;
}

/** Étapes affichées sur la timeline côté client (5 phases). */
export const CLIENT_TRANSACTION_FLOW: {
  statuses: TransactionStatus[];
  label: string;
  description: string;
}[] = [
  {
    statuses: ['INITIATED'],
    label: 'Opérateur assigné',
    description: 'Envoyez vos fonds sur le numéro indiqué',
  },
  {
    statuses: ['CLIENT_SENT'],
    label: 'Paiement envoyé',
    description: "L'opérateur vérifie votre reçu…",
  },
  {
    statuses: ['OPERATOR_VERIFIED'],
    label: 'Vérification',
    description: 'Le reçu est validé, préparation de l’envoi',
  },
  {
    statuses: ['OPERATOR_SENT'],
    label: 'Fonds en route',
    description: 'Vérifiez votre compte puis confirmez',
  },
  {
    statuses: ['COMPLETED'],
    label: 'Échange terminé',
    description: 'Transaction clôturée',
  },
];

export function clientTimelineStepIndex(status: TransactionStatus): number {
  if (status === 'DISPUTED' || status === 'CANCELLED') return -1;
  const i = CLIENT_TRANSACTION_FLOW.findIndex((s) => s.statuses.includes(status));
  return i >= 0 ? i : 0;
}

export const TRANSACTION_STEPS: Record<
  TransactionStatus,
  { label: string; description: string; step: number }
> = {
  INITIATED: {
    step: 1,
    label: 'Assigné',
    description: 'En attente de l’envoi client',
  },
  CLIENT_SENT: {
    step: 2,
    label: 'Reçu client',
    description: 'À vérifier',
  },
  OPERATOR_VERIFIED: {
    step: 3,
    label: 'Reçu validé',
    description: 'Envoyer les fonds au client',
  },
  OPERATOR_SENT: {
    step: 4,
    label: 'Fonds envoyés',
    description: 'En attente de confirmation client',
  },
  COMPLETED: {
    step: 5,
    label: 'Terminé',
    description: 'Clôturée',
  },
  DISPUTED: {
    step: -1,
    label: 'Litige',
    description: 'Intervention admin',
  },
  CANCELLED: {
    step: -1,
    label: 'Annulée',
    description: 'Transaction annulée',
  },
};
