export type { User, UserRole, KycStatus } from './user';
export type {
  OperatorLog,
  OperatorLogAction,
  TransactionDetail,
} from './operator';
export type {
  ExchangeRequest,
  RequestStatus,
  RequestType,
} from './request';
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type { Order, OrderType, OrderStatus, PaymentMethod } from './order';
export type { OrderApiRaw, OrderListUserApi, DecimalJsJson } from './order-api';
export type {
  PlatformReceiveAccount,
  Transaction,
  TransactionStatus,
} from './transaction';
export type { Message, ChatAttachment } from './chat';
export type { Review } from './review';
export type { Dispute } from './dispute';
export type {
  AdminRevenueSummary,
  AppNotification,
  AuthTokens,
  CreateDisputeDto,
  CreateOrderDto,
  CreatePlatformAccountDto,
  CreateRequestDto,
  CreateReviewDto,
  ExchangeRate,
  KpiDashboard,
  KycDocument,
  KycStatusResponse,
  LoginDto,
  NotificationPrefs,
  OrderFilters,
  PlatformAccount,
  RatesCalculateResult,
  RegisterDto,
  TransactionFilters,
  UpdatePlatformAccountDto,
  UpdateUserDto,
} from './api-dtos';
