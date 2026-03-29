import type { ExchangeRate } from '@/types/api-dtos';
import { ratesApi } from '@/services/api';

/** @deprecated Préférer le type `ExchangeRate` depuis `@/types`. */
export type LiveRate = ExchangeRate;

/** Utilisé si l’API est injoignable (ex. `next build` sans backend, réseau coupé). */
export const FALLBACK_EXCHANGE_RATE: ExchangeRate = {
  rate: 0.15,
  inverseRate: 6.67,
  fromCurrency: 'XOF',
  toCurrency: 'RUB',
  trend: 'stable',
  percentChange: 0,
  fetchedAt: new Date().toISOString(),
};

export async function fetchLiveRate(): Promise<ExchangeRate> {
  try {
    return await ratesApi.currentWithTrend();
  } catch {
    return { ...FALLBACK_EXCHANGE_RATE, fetchedAt: new Date().toISOString() };
  }
}
