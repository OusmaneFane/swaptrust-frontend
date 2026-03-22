export type { User } from './user';
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
  Transaction,
  TransactionListDirection,
  TransactionStatus,
} from './transaction';
export type { Message, ChatAttachment } from './chat';
export type { Review } from './review';
export type { Dispute } from './dispute';
export type {
  AppNotification,
  AuthTokens,
  CreateDisputeDto,
  CreateOrderDto,
  CreateReviewDto,
  ExchangeRate,
  KpiDashboard,
  KycDocument,
  KycStatusResponse,
  LoginDto,
  NotificationPrefs,
  OrderFilters,
  RatesCalculateResult,
  RegisterDto,
  TransactionFilters,
  UpdateUserDto,
} from './api-dtos';
