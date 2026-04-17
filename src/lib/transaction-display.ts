import type { PaymentMethod } from '@/types/order';
import type { Transaction } from '@/types/transaction';
import { formatCFA, formatRUB } from '@/lib/utils';

export function isCfaPaymentRail(method: PaymentMethod | undefined): boolean {
  return (
    method === 'ORANGE_MONEY' ||
    method === 'MOOV_MONEY' ||
    method === 'WAVE'
  );
}

export function isRubPaymentRail(method: PaymentMethod | undefined): boolean {
  return method === 'SBP' || method === 'BTB' || method === 'T-BANK';
}

/** Formate un montant mineur dans la devise d’envoi probable (méthode de paiement). */
export function formatMinorForSendRail(
  tx: Transaction,
  minor: number,
): string {
  if (isCfaPaymentRail(tx.paymentMethod)) return formatCFA(minor);
  if (isRubPaymentRail(tx.paymentMethod)) return formatRUB(minor);
  return formatCFA(minor);
}

/**
 * Libellé du montant total à envoyer pour un reçu / instruction client.
 */
export function formatGrossSendForClient(tx: Transaction): string {
  const method = tx.paymentMethod;
  if (isCfaPaymentRail(method)) {
    const minor = tx.grossAmount ?? tx.amountCfa;
    return formatCFA(minor);
  }
  if (isRubPaymentRail(method)) {
    const minor = tx.grossAmount ?? tx.amountRub;
    return formatRUB(minor);
  }
  if (tx.grossAmount != null) {
    return formatCFA(tx.grossAmount);
  }
  return formatCFA(tx.amountCfa);
}
