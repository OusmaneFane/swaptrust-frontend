import type { ExchangeRate } from '@/types/api-dtos';
import { ratesApi } from '@/services/api';

/** @deprecated Préférer le type `ExchangeRate` depuis `@/types`. */
export type LiveRate = ExchangeRate;

export async function fetchLiveRate(): Promise<ExchangeRate> {
  return ratesApi.currentWithTrend();
}
