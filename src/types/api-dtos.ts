import type { OrderType, PaymentMethod } from './order';
import type { RequestType } from './request';

/** KYC */
export interface KycStatusResponse {
  status: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  document?: KycDocument;
  rejectionNote?: string;
}

export interface KycDocument {
  id: number;
  userId: number;
  docType: string;
  frontUrl: string;
  backUrl: string;
  selfieUrl: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

/** Taux — vue affichage (dérivée de GET /rates/current + historique). */
export interface ExchangeRate {
  rate: number;
  fromCurrency?: string;
  toCurrency?: string;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
  fetchedAt: string;
  /** Présent quand la source API expose les deux sens. */
  inverseRate?: number;
}

export interface RatesCalculateResult {
  result: number;
  rate: number;
  /** Montant commission en même unité minoritaire que le montant envoyé (si fourni par l’API). */
  commissionAmount?: number;
  commissionRate?: number;
}

/** Admin dashboard */
export interface KpiDashboard {
  todayTransactions: number;
  totalVolumeCfa: number;
  newUsersToday: number;
  openDisputes: number;
  completionRate: number;
  totalUsers: number;
}

/** Auth */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phoneMali?: string;
  phoneRussia?: string;
  countryResidence: 'MALI' | 'RUSSIA' | 'OTHER';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UpdateUserDto {
  name?: string;
  phoneMali?: string;
  phoneRussia?: string;
  countryResidence?: 'MALI' | 'RUSSIA' | 'OTHER';
}

/** Filtres listes */
export interface OrderFilters {
  type?: OrderType;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  /** Compat API Nest skip/take */
  skip?: number;
  take?: number;
  status?: string;
  currencyFrom?: string;
  currencyTo?: string;
}

export interface TransactionFilters {
  status?: string;
  direction?: 'CFA_TO_RUB' | 'RUB_TO_CFA' | 'sent' | 'received';
  startDate?: string;
  endDate?: string;
  limit?: number;
  period?: string;
}

export interface CreateOrderDto {
  type: OrderType;
  amountFrom: number;
  currencyFrom: 'XOF' | 'RUB';
  currencyTo: 'XOF' | 'RUB';
  paymentMethod: PaymentMethod;
  phoneReceive: string;
  note?: string;
}

/** POST /requests */
export interface CreateRequestDto {
  type: RequestType;
  amountWanted: number;
  paymentMethod: PaymentMethod;
  phoneToSend: string;
  note?: string;
}

export interface CreateReviewDto {
  rating: number;
  comment?: string;
}

export interface CreateDisputeDto {
  reason: string;
  description?: string;
}

/** Notifications */
export interface NotificationPrefs {
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  newExchangeRequest: boolean;
  paymentReceived: boolean;
  transactionCompleted: boolean;
  disputeOpened: boolean;
  kycStatusChanged: boolean;
  rateAlert: boolean;
  rateAlertThreshold?: number;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}
