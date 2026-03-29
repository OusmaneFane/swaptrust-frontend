import type { PaymentMethod } from './order';
import type { User } from './user';

export type RequestType = 'NEED_RUB' | 'NEED_CFA';
export type RequestStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface ExchangeRequest {
  id: number;
  client: User;
  type: RequestType;
  /** Centimes (CFA) ou kopecks (RUB) selon currencyWanted */
  amountWanted: number;
  currencyWanted: 'RUB' | 'XOF';
  amountToSend: number;
  currencyToSend: 'XOF' | 'RUB';
  rateAtRequest: number;
  paymentMethod: PaymentMethod;
  phoneToSend: string;
  note: string | null;
  status: RequestStatus;
  expiresAt: string;
  createdAt: string;
}
