import type { Transaction } from '@/types/transaction';
import {
  getSwaptrustReceiveFallback,
  type SwaptrustReceiveDisplay,
} from '@/lib/swaptrust-receive';

/**
 * Numéro / IBAN affiché au client pour l’envoi : toujours un compte SwapTrust
 * (API `platformAccount` ou variables `NEXT_PUBLIC_SWAPTRUST_*`).
 */
export function resolveClientSendDestination(
  tx: Transaction,
): SwaptrustReceiveDisplay | null {
  const pa = tx.platformAccount;
  if (pa?.accountNumber?.trim()) {
    return {
      accountName: pa.accountName?.trim() || 'SwapTrust',
      accountNumber: pa.accountNumber.trim(),
    };
  }
  const method = tx.paymentMethod;
  if (method) return getSwaptrustReceiveFallback(method);
  return null;
}
