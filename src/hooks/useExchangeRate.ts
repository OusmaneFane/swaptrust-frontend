'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLiveRate } from '@/services/rateService';

export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchange-rate'],
    queryFn: fetchLiveRate,
    staleTime: 30_000,
  });
}
