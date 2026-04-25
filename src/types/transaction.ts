import type { PaymentMethod } from './order';
import type { User } from './user';

/** Référence API : numéro / IBAN sur lequel le client envoie (DoniSend, pas l’opérateur). */
export interface PlatformReceiveAccount {
  id?: number;
  method?: PaymentMethod;
  accountNumber: string;
  accountName: string;
}

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
  /**
   * Champs "view" renvoyés par l’API (URL prêtes à ouvrir), ex. `/api/v1/proofs/<uuid>.pdf`.
   * Utile pour debug; côté UI on continue d’utiliser `ProofViewer` (fetch blob + Bearer).
   */
  clientProofViewUrl?: string | null;
  operatorProofViewUrl?: string | null;
  platformToOperatorProofViewUrl?: string | null;
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
  /** Méthode de la demande (pour fallback numéros DoniSend publics). */
  paymentMethod?: PaymentMethod;
  /** Montant total à envoyer par le client (mineur, ex. centimes CFA). */
  grossAmount?: number;
  /** Montant net cédé à l’opérateur après commission. */
  netAmount?: number;
  /** Taux Google brut (référence), même échelle que GET /rates/current. */
  googleRate?: number;
  /** Pourcentage de commission appliqué (ex. 2). */
  commissionPercent?: number;
  /** Compte officiel DoniSend — seul numéro visible au client pour l’envoi. */
  platformAccount?: PlatformReceiveAccount | null;
  platformToOperatorProofUrl?: string | null;
  platformTransferredAt?: string | null;
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
    description: 'Envoyez le montant exact sur le numéro DoniSend indiqué',
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
