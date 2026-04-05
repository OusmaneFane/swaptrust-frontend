import type { PaymentMethod } from '@/types/order';

export interface SwaptrustReceiveDisplay {
  accountName: string;
  accountNumber: string;
}

/**
 * Numéros de réception SwapTrust (fallback) quand l’API ne renvoie pas encore `platformAccount`.
 * Même sémantique que les variables serveur du prompt (préfixe NEXT_PUBLIC_ pour le client).
 */
export function getSwaptrustReceiveFallback(
  method: PaymentMethod,
): SwaptrustReceiveDisplay | null {
  switch (method) {
    case 'ORANGE_MONEY': {
      const v = process.env.NEXT_PUBLIC_SWAPTRUST_ORANGE_MONEY?.trim();
      if (!v) return null;
      return {
        accountName: 'SwapTrust — Orange Money',
        accountNumber: v,
      };
    }
    case 'WAVE': {
      const v = process.env.NEXT_PUBLIC_SWAPTRUST_WAVE?.trim();
      if (!v) return null;
      return {
        accountName: 'SwapTrust — Wave',
        accountNumber: v,
      };
    }
    case 'BANK_TRANSFER': {
      const iban = process.env.NEXT_PUBLIC_SWAPTRUST_BANK_IBAN?.trim();
      if (!iban) return null;
      const bank = process.env.NEXT_PUBLIC_SWAPTRUST_BANK_NAME?.trim();
      return {
        accountName: bank
          ? `SwapTrust — ${bank}`
          : 'SwapTrust — Virement bancaire',
        accountNumber: iban,
      };
    }
    default:
      return null;
  }
}

/** Affichage lisible (téléphone +…, IBAN groupé par 4). */
export function formatAccountForDisplay(raw: string): string {
  const compact = raw.replace(/\s/g, '');
  if (compact.startsWith('+')) {
    const d = compact.slice(1);
    const pairs = d.match(/.{1,2}/g);
    if (pairs) return `+${pairs.join(' ')}`;
    return compact;
  }
  if (/^[A-Za-z]{2}/.test(compact) && compact.length > 8) {
    return compact.replace(/(.{4})/g, '$1 ').trim();
  }
  return raw;
}
