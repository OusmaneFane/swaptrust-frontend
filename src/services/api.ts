import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';
import type { ApiResponse, Order, Transaction, Message, Review, Dispute, User } from '@/types';
import type { OrderApiRaw } from '@/types/order-api';
import type {
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
} from '@/types/api-dtos';
import type { AppNotification } from '@/types/api-dtos';
import { getApiBaseUrl } from '@/lib/api-base';
import { keysToSnakeCase } from '@/lib/object-case';
import { normalizeOrderFromApi } from '@/lib/normalize-order';
import { parseDecimalLike } from '@/lib/parse-decimal-json';

const api = axios.create({
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  config.baseURL = getApiBaseUrl();
  if (typeof window === 'undefined') return config;
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      await signOut({ callbackUrl: '/connexion' });
    }
    return Promise.reject(error);
  },
);

function unwrapApi<T>(body: unknown): T {
  if (
    body !== null &&
    typeof body === 'object' &&
    'data' in body &&
    'success' in body
  ) {
    return (body as ApiResponse<T>).data;
  }
  return body as T;
}

async function getUnwrapped<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<unknown>(path, {
    params: params && stripUndefined(params),
  });
  return unwrapApi<T>(data);
}

async function postUnwrapped<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await api.post<unknown>(path, body);
  return unwrapApi<T>(data);
}

async function putUnwrapped<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await api.put<unknown>(path, body);
  return unwrapApi<T>(data);
}

async function deleteUnwrapped<T = void>(path: string): Promise<T> {
  const { data } = await api.delete<unknown>(path);
  return unwrapApi<T>(data);
}

function stripUndefined(
  o: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === '') continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    }
  }
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseOrdersListPayload(data: unknown): { items: OrderApiRaw[]; total: number } | null {
  if (!isRecord(data)) return null;
  if (Array.isArray(data.items)) {
    return {
      items: data.items as OrderApiRaw[],
      total: typeof data.total === 'number' ? data.total : data.items.length,
    };
  }
  if (Array.isArray(data.data)) {
    return { items: data.data as OrderApiRaw[], total: data.data.length };
  }
  return null;
}

function normalizeOrdersList(data: unknown): { items: Order[]; total: number } {
  const parsed = parseOrdersListPayload(data);
  if (!parsed) return { items: [], total: 0 };
  return {
    items: parsed.items.map((raw) => normalizeOrderFromApi(raw)),
    total: parsed.total,
  };
}

function orderBodyUseSnakeCase(): boolean {
  return (
    process.env.NEXT_PUBLIC_ORDER_API_SNAKE_CASE === '1' ||
    process.env.ORDER_API_SNAKE_CASE === '1'
  );
}

function buildOrderFiltersParams(f: OrderFilters): Record<string, unknown> {
  return {
    type: f.type,
    paymentMethod: f.paymentMethod,
    minAmount: f.minAmount,
    maxAmount: f.maxAmount,
    page: f.page,
    limit: f.limit,
    skip: f.skip,
    take: f.take,
    status: f.status,
    currencyFrom: f.currencyFrom,
    currencyTo: f.currencyTo,
  };
}

interface RateHistoryRow {
  fromCurrency?: string;
  toCurrency?: string;
  rate?: unknown;
  fetchedAt?: string;
}

function trendFromHistory(rows: RateHistoryRow[]): 'up' | 'down' | 'stable' {
  const series = rows
    .filter((r) => r.fromCurrency === 'XOF' && r.toCurrency === 'RUB')
    .sort(
      (a, b) =>
        new Date(a.fetchedAt ?? 0).getTime() - new Date(b.fetchedAt ?? 0).getTime(),
    )
    .map((r) => parseDecimalLike(r.rate))
    .filter((n) => n > 0);
  if (series.length < 2) return 'stable';
  const a = series[series.length - 2]!;
  const b = series[series.length - 1]!;
  const rel = (b - a) / a;
  if (rel > 0.00005) return 'up';
  if (rel < -0.00005) return 'down';
  return 'stable';
}

function mapCurrentToExchangeRate(
  raw: Record<string, unknown>,
  trend: 'up' | 'down' | 'stable',
): ExchangeRate {
  const xofRub = Number(raw.XOF_RUB);
  const rubXof = Number(raw.RUB_XOF);
  const fetchedAt =
    typeof raw.fetchedAt === 'string' ? raw.fetchedAt : new Date().toISOString();
  const rate = Number.isFinite(xofRub) ? xofRub : 0;
  const inverse = Number.isFinite(rubXof) ? rubXof : 0;
  return {
    rate,
    inverseRate: inverse,
    fromCurrency: 'XOF',
    toCurrency: 'RUB',
    trend,
    percentChange: 0,
    fetchedAt,
  };
}

function extractTransactionList(raw: unknown): Transaction[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as Transaction[];
  if (isRecord(raw)) {
    if (Array.isArray(raw.items)) return raw.items as Transaction[];
    if (Array.isArray(raw.data)) return raw.data as Transaction[];
  }
  return [];
}

function extractUserList(raw: unknown): User[] {
  if (Array.isArray(raw)) return raw as User[];
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items as User[];
  if (isRecord(raw) && Array.isArray(raw.data)) return raw.data as User[];
  return [];
}

// ─── AUTH ───────────────────────────────────────────────────────────────────

export const authApi = {
  register: (dto: RegisterDto) => api.post<unknown>('/auth/register', dto),
  login: (dto: LoginDto) =>
    api.post<unknown>('/auth/login', dto),
  sendOtp: (phone: string) => api.post('/auth/otp/send', { phone }),
  verifyOtp: (phone: string, code: string) =>
    api.post('/auth/otp/verify', { phone, code }),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    postUnwrapped<AuthTokens>('/auth/refresh', { refreshToken }),
  me: () => getUnwrapped<User>('/auth/me'),
};

// ─── USERS ──────────────────────────────────────────────────────────────────

export const usersApi = {
  updateMe: (dto: UpdateUserDto) => putUnwrapped<User>('/users/me', dto),
  deleteMe: () => deleteUnwrapped('/users/me'),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post<unknown>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => unwrapApi<{ avatar: string }>(r.data));
  },
  getProfile: (id: number) => getUnwrapped<User>(`/users/${id}`),
  getReviews: async (id: number): Promise<Review[]> => {
    const { data } = await api.get<unknown>(`/users/${id}/reviews`);
    const inner = unwrapApi<unknown>(data);
    if (Array.isArray(inner)) return inner as Review[];
    if (isRecord(inner) && Array.isArray(inner.data)) return inner.data as Review[];
    return [];
  },
  listAll: async (params?: Record<string, string>): Promise<User[]> => {
    const { data } = await api.get<unknown>('/users', { params });
    return extractUserList(unwrapApi(data));
  },
};

// ─── KYC ─────────────────────────────────────────────────────────────────────

export const kycApi = {
  submit: (payload: {
    docType: string;
    front: File;
    back: File;
    selfie: File;
  }) => {
    const form = new FormData();
    form.append('docType', payload.docType);
    form.append('front', payload.front);
    form.append('back', payload.back);
    form.append('selfie', payload.selfie);
    return api.post<unknown>('/kyc/submit', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => unwrapApi<unknown>(r.data));
  },
  getStatus: () => getUnwrapped<KycStatusResponse>('/kyc/status'),
  approve: (id: number) => api.put(`/kyc/admin/${id}/approve`),
  reject: (id: number, note: string) =>
    api.put(`/kyc/admin/${id}/reject`, { note }),
};

// ─── ORDERS ─────────────────────────────────────────────────────────────────

export const ordersApi = {
  list: async (params?: OrderFilters): Promise<{ items: Order[]; total: number }> => {
    const { data } = await api.get<unknown>('/orders', {
      params: stripUndefined(buildOrderFiltersParams(params ?? {})),
    });
    return normalizeOrdersList(unwrapApi(data));
  },

  create: async (dto: CreateOrderDto): Promise<Order> => {
    const payload: Record<string, unknown> = {
      type: dto.type,
      amountFrom: dto.amountFrom,
      currencyFrom: dto.currencyFrom,
      currencyTo: dto.currencyTo,
      paymentMethod: dto.paymentMethod,
      phoneReceive: dto.phoneReceive,
    };
    if (dto.note !== undefined && dto.note !== '') payload.note = dto.note;
    const json = orderBodyUseSnakeCase() ? keysToSnakeCase(payload) : payload;
    const { data } = await api.post<unknown>('/orders', json);
    return normalizeOrderFromApi(unwrapApi<OrderApiRaw>(data));
  },

  mine: async (): Promise<{ items: Order[]; total: number }> => {
    const { data } = await api.get<unknown>('/orders/mine');
    return normalizeOrdersList(unwrapApi(data));
  },

  getById: (id: number) =>
    getUnwrapped<OrderApiRaw>(`/orders/${id}`).then((raw) =>
      normalizeOrderFromApi(raw),
    ),

  getMatches: async (id: number): Promise<Order[]> => {
    const { data } = await api.get<unknown>(`/orders/${id}/matches`);
    const inner = unwrapApi<unknown>(data);
    if (Array.isArray(inner)) {
      return (inner as OrderApiRaw[]).map(normalizeOrderFromApi);
    }
    return [];
  },

  update: (id: number, dto: Partial<CreateOrderDto>) =>
    putUnwrapped<OrderApiRaw>(`/orders/${id}`, dto).then(normalizeOrderFromApi),

  cancel: (id: number) => deleteUnwrapped(`/orders/${id}`),
};

// ─── TRANSACTIONS ───────────────────────────────────────────────────────────

export const transactionsApi = {
  list: async (params?: TransactionFilters): Promise<Transaction[]> => {
    const { data } = await api.get<unknown>('/transactions', {
      params: params
        ? stripUndefined(params as Record<string, unknown>)
        : undefined,
    });
    return extractTransactionList(unwrapApi(data));
  },

  initiate: (dto: { senderOrderId: number; receiverOrderId: number }) =>
    postUnwrapped<Transaction>('/transactions', dto),

  getById: (id: number) => getUnwrapped<Transaction>(`/transactions/${id}`),

  confirmSend: (id: number, proofFile: File) => {
    const form = new FormData();
    form.append('proof', proofFile);
    return api
      .post<unknown>(`/transactions/${id}/confirm-send`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => unwrapApi<Transaction>(r.data));
  },

  confirmReceive: (id: number) =>
    postUnwrapped<Transaction>(`/transactions/${id}/confirm-receive`),

  cancel: (id: number) => postUnwrapped<Transaction>(`/transactions/${id}/cancel`),
};

// ─── CHAT ───────────────────────────────────────────────────────────────────

export const chatApi = {
  getMessages: (transactionId: number) =>
    getUnwrapped<Message[]>(`/chat/transactions/${transactionId}/messages`),

  sendMessage: (
    transactionId: number,
    content: string,
    type: 'TEXT' | 'IMAGE' = 'TEXT',
  ) =>
    postUnwrapped<Message>(`/chat/transactions/${transactionId}/messages`, {
      content,
      type,
    }),

  markRead: (transactionId: number) =>
    api.put(`/chat/transactions/${transactionId}/read`),
};

// ─── REVIEWS ────────────────────────────────────────────────────────────────

export const reviewsApi = {
  create: (transactionId: number, dto: CreateReviewDto) =>
    postUnwrapped<Review>(`/reviews/transactions/${transactionId}`, dto),
  getForUser: (userId: number) => getUnwrapped<Review[]>(`/reviews/users/${userId}`),
};

// ─── DISPUTES ───────────────────────────────────────────────────────────────

export const disputesApi = {
  open: (transactionId: number, dto: CreateDisputeDto) =>
    postUnwrapped<Dispute>(`/disputes/transactions/${transactionId}`, dto),

  getById: (id: number) => getUnwrapped<Dispute>(`/disputes/${id}`),

  respond: (id: number, description: string) =>
    api.post(`/disputes/${id}/respond`, { description }),

  addAttachment: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/disputes/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  adminList: () => getUnwrapped<Dispute[]>('/disputes/admin'),

  adminResolve: (id: number, resolution: string) =>
    api.put(`/disputes/admin/${id}/resolve`, { resolution }),
};

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────

export const notificationsApi = {
  list: () => getUnwrapped<AppNotification[]>('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markOneRead: (id: number) => api.put(`/notifications/${id}/read`),
  delete: (id: number) => api.delete(`/notifications/${id}`),
  getPrefs: () => getUnwrapped<NotificationPrefs>('/notifications/preferences'),
  updatePrefs: (prefs: Partial<NotificationPrefs>) =>
    putUnwrapped<NotificationPrefs>('/notifications/preferences', prefs),
};

// ─── RATES ──────────────────────────────────────────────────────────────────

export const ratesApi = {
  current: async (): Promise<ExchangeRate> => {
    const { data } = await api.get<unknown>('/rates/current');
    const raw = unwrapApi<Record<string, unknown>>(data);
    return mapCurrentToExchangeRate(raw, 'stable');
  },

  /** Taux + tendance (historique 24h). */
  currentWithTrend: async (): Promise<ExchangeRate> => {
    const [currentRes, historyRes] = await Promise.all([
      api.get<unknown>('/rates/current'),
      api.get<unknown>('/rates/history'),
    ]);
    const raw = unwrapApi<Record<string, unknown>>(currentRes.data);
    const histRaw = unwrapApi<unknown>(historyRes.data);
    const histRows = Array.isArray(histRaw)
      ? (histRaw as RateHistoryRow[])
      : [];
    const trend = trendFromHistory(histRows);
    return mapCurrentToExchangeRate(raw, trend);
  },

  history: async (): Promise<RateHistoryRow[]> => {
    const { data } = await api.get<unknown>('/rates/history');
    const inner = unwrapApi<unknown>(data);
    return Array.isArray(inner) ? (inner as RateHistoryRow[]) : [];
  },

  calculate: (amount: number, from: 'XOF' | 'RUB', to: 'XOF' | 'RUB') =>
    getUnwrapped<RatesCalculateResult>('/rates/calculate', {
      amount: String(amount),
      from,
      to,
    }),
};

// ─── ADMIN ──────────────────────────────────────────────────────────────────

export const adminApi = {
  dashboard: () => getUnwrapped<KpiDashboard>('/admin/dashboard'),

  users: (params?: Record<string, string>) =>
    getUnwrapped<User[]>('/admin/users', params as Record<string, unknown>),

  banUser: (id: number) => api.put(`/admin/users/${id}/ban`),

  transactions: (params?: Record<string, string>) =>
    getUnwrapped<Transaction[]>('/admin/transactions', params as Record<string, unknown>),

  disputes: () => getUnwrapped<Dispute[]>('/admin/disputes'),

  resolveDispute: (id: number, resolution: string) =>
    api.put(`/admin/disputes/${id}/resolve`, { resolution }),

  kycPending: () => getUnwrapped<KycDocument[]>('/admin/kyc/pending'),
};

export default api;
