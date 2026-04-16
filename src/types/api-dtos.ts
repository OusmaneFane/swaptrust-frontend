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

/**
 * GET /rates/current — `rate` = Google Finance brut (₽ pour 1 F CFA, transparent).
 * Les demandes utilisent ce `rate` + commission à part. `rateWithSpread` est informatif seulement.
 */
export interface ExchangeRate {
  /** ₽ (unité majeure) pour 1 franc CFA — facteur multiplicatif côté affichage (ex. 1000 F → 1000×rate ₽). */
  rate: number;
  fromCurrency?: string;
  toCurrency?: string;
  trend: 'up' | 'down' | 'stable';
  /** Souvent `percentChange24h` de l’API. */
  percentChange: number;
  fetchedAt: string;
  /** F CFA pour 1 ₽ (maj.) — égal à `rubPerXof` de l’API (~ 1/rate). */
  inverseRate?: number;
  /** Informatif (marge) — ne pas fusionner dans le taux affiché comme taux « client ». */
  rateWithSpread?: number;
  rubPerXofWithSpread?: number;
  /** Ex. `cache`, `live` */
  source?: string;
}

export interface RatesCalculateResult {
  /** Montant dans l’unité minoritaire de la devise `to` (centimes XOF ou kopecks RUB). */
  result: number;
  rate: number;
  /**
   * Commission en unité minoritaire de la devise **`from`**
   * (kopecks si from=RUB, centimes si from=XOF), si l’API la renvoie.
   */
  commissionAmount?: number;
  commissionRate?: number;
}

/** GET/POST /admin/platform-accounts — compte de réception DoniSend côté client. */
export interface PlatformAccount {
  id: number;
  method: PaymentMethod;
  accountNumber: string;
  accountName: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePlatformAccountDto {
  method: PaymentMethod;
  accountNumber: string;
  accountName: string;
  /** Défaut côté API souvent `true`. */
  isActive?: boolean;
}

export interface UpdatePlatformAccountDto {
  accountNumber?: string;
  accountName?: string;
  isActive?: boolean;
}

/** GET /admin/revenue/summary — volumes / commissions (CFA, flux NEED_RUB typique). */
export interface AdminRevenueSummary {
  period: string;
  transactionCount: number;
  /** Souvent en centimes CFA — afficher avec `formatCFA` si cohérent avec votre API. */
  totalVolumeCfa: number;
  totalCommissionCfa: number;
  pendingTransfers: number;
  pendingAmount: number;
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
  /** `223` + 8 chiffres, sans `+` */
  phoneMali?: string;
  /** `7` + 10 chiffres, sans `+` */
  phoneRussia?: string;
  countryResidence: 'MALI' | 'RUSSIA' | 'OTHER';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UpdateUserDto {
  name?: string;
  /** `223` + 8 chiffres, sans `+` */
  phoneMali?: string;
  /** `7` + 10 chiffres, sans `+` */
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
  /** Indicatif pays + national, chiffres uniquement, sans `+` */
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
