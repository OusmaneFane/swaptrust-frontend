import type { OrderStatus, OrderType, PaymentMethod } from './order';

/** Utilisateur embarqué dans la liste des ordres (GET /orders). */
export interface OrderListUserApi {
  id: number;
  name: string;
  ratingAvg?: number;
  kycStatus?: string;
  email?: string;
  avatar?: string | null;
}

/** Ligne brute renvoyée par l’API Nest (Decimal, montants string, etc.). */
export interface OrderApiRaw {
  id: number;
  userId: number;
  type: OrderType;
  amountFrom: string | number;
  currencyFrom: 'XOF' | 'RUB';
  amountTo: string | number;
  currencyTo: 'XOF' | 'RUB';
  rate: number | string | DecimalJsJson;
  commission: string | number;
  paymentMethod: PaymentMethod;
  phoneReceive: string;
  note: string | null;
  status: OrderStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: OrderListUserApi;
  /** Présent sur certaines listes Nest (relation). */
  transaction?: unknown;
}

/** Représentation JSON de Prisma Decimal / decimal.js. */
export interface DecimalJsJson {
  s: number;
  e: number;
  d: number[];
}
