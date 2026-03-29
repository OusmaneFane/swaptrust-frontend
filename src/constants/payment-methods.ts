import type { PaymentMethod } from '@/types/order';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ORANGE_MONEY: 'Orange Money',
  WAVE: 'Wave',
  BANK_TRANSFER: 'Virement',
  SBP: 'SBP',
  OTHER: 'Autre',
};
