import type { OrderType } from '@/types/order';

/** Type d’ordre complémentaire (CFA ↔ RUB). */
export function complementaryOrderType(t: OrderType): OrderType {
  return t === 'SEND_CFA' ? 'SEND_RUB' : 'SEND_CFA';
}

/**
 * Mappe les deux ordres vers le corps attendu par POST /transactions.
 * Convention API : senderOrderId = ordre SEND_CFA, receiverOrderId = ordre SEND_RUB.
 */
export function pairOrderIdsForTransaction(
  a: { id: number; type: OrderType },
  b: { id: number; type: OrderType },
): { senderOrderId: number; receiverOrderId: number } | null {
  const cfa = a.type === 'SEND_CFA' ? a : b.type === 'SEND_CFA' ? b : null;
  const rub = a.type === 'SEND_RUB' ? a : b.type === 'SEND_RUB' ? b : null;
  if (!cfa || !rub) return null;
  return {
    senderOrderId: cfa.id,
    receiverOrderId: rub.id,
  };
}
