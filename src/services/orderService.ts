/**
 * Compatibilité — préférer `ordersApi` depuis `@/services/api`.
 */
import type { OrderFilters, CreateOrderDto } from '@/types/api-dtos';
import { ordersApi } from '@/services/api';
export type { OrderFilters, CreateOrderDto } from '@/types/api-dtos';
export { formatOrderCreateError } from '@/lib/format-order-error';

export async function fetchOrders(filters: OrderFilters) {
  return ordersApi.list(filters);
}

export async function fetchOrder(id: number) {
  return ordersApi.getById(id);
}

export async function createOrder(body: CreateOrderDto) {
  return ordersApi.create(body);
}
