import type { OrderType } from '@/types/order';

const DEFAULT_COMMISSION_PCT = 2;

export interface ComputedOrderAmounts {
  amountFrom: number;
  currencyFrom: 'XOF' | 'RUB';
  amountTo: number;
  currencyTo: 'XOF' | 'RUB';
  commission: number;
  rate: number;
}

/**
 * Montants en centimes (mineures) pour CFA et RUB, alignés sur ExchangeCalculator.
 */
export function computeOrderAmounts(params: {
  orderType: OrderType;
  amountCents: number;
  rate: number;
  commissionPct?: number;
}): ComputedOrderAmounts | null {
  const commissionPct = params.commissionPct ?? DEFAULT_COMMISSION_PCT;
  const { orderType, amountCents, rate } = params;
  if (amountCents <= 0 || !Number.isFinite(rate) || rate <= 0) {
    return null;
  }
  const commission = Math.round((amountCents * commissionPct) / 100);
  if (orderType === 'SEND_CFA') {
    const after = amountCents - commission;
    const amountTo = Math.round(after * rate);
    return {
      amountFrom: amountCents,
      currencyFrom: 'XOF',
      amountTo,
      currencyTo: 'RUB',
      commission,
      rate,
    };
  }
  const after = amountCents - commission;
  const amountTo = Math.round(after / rate);
  return {
    amountFrom: amountCents,
    currencyFrom: 'RUB',
    amountTo,
    currencyTo: 'XOF',
    commission,
    rate,
  };
}
