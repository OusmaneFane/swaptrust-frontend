import type { Transaction } from './transaction';

export type DisputeStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface Dispute {
  id: number;
  transaction: Transaction;
  openedById: number;
  reason: string;
  status: DisputeStatus;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  /** Réponse de l’autre partie (POST /disputes/{id}/respond) — si renvoyée par l’API. */
  counterpartyResponse?: string | null;
  /** Pièces / preuves associées au dossier — forme libre selon le backend. */
  attachments?: { url: string; label?: string }[];
}
