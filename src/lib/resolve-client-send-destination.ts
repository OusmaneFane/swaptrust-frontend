import type { Transaction } from '@/types/transaction';
import {
  getDonisendReceiveFallback,
  type DonisendReceiveDisplay,
} from '@/lib/donisend-receive';

/**
 * Numéro / IBAN affiché au client pour l’envoi : toujours un compte DoniSend
 * (API `platformAccount` ou variables `NEXT_PUBLIC_SWAPTRUST_*`).
 */
export function resolveClientSendDestination(
  tx: Transaction,
): DonisendReceiveDisplay | null {
  const pa = tx.platformAccount;
  if (pa?.accountNumber?.trim()) {
    return {
      accountName: pa.accountName?.trim() || 'DoniSend',
      accountNumber: pa.accountNumber.trim(),
    };
  }
  const method = tx.paymentMethod;
  if (method) return getDonisendReceiveFallback(method);
  return null;
}
