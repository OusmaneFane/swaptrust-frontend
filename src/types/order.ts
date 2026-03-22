import type { User } from './user';

export type OrderType = 'SEND_CFA' | 'SEND_RUB';
export type OrderStatus =
  | 'ACTIVE'
  | 'MATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';
export type PaymentMethod =
  | 'ORANGE_MONEY'
  | 'WAVE'
  | 'BANK_TRANSFER'
  | 'SBP'
  | 'OTHER';

export interface Order {
  id: number;
  user: User;
  type: OrderType;
  amountFrom: number;
  currencyFrom: 'XOF' | 'RUB';
  amountTo: number;
  currencyTo: 'XOF' | 'RUB';
  rate: number;
  commission: number;
  paymentMethod: PaymentMethod;
  phoneReceive: string;
  note: string | null;
  status: OrderStatus;
  expiresAt: string | null;
  createdAt: string;
}
