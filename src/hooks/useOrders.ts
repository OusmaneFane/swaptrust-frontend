'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ordersApi } from '@/services/api';
import type { OrderFilters } from '@/types/api-dtos';

const TAKE = 20;

export function useOrdersInfinite(
  filters: Omit<OrderFilters, 'page' | 'limit' | 'skip' | 'take'>,
) {
  return useInfiniteQuery({
    queryKey: ['orders', filters] as const,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      ordersApi.list({
        ...filters,
        skip: pageParam,
        take: TAKE,
      }),
    getNextPageParam: (last, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.items.length, 0);
      if (last.items.length < TAKE || loaded >= last.total) {
        return undefined;
      }
      return loaded;
    },
  });
}
