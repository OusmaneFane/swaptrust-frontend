import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import type {
  ApiResponse,
  ExchangeRequest,
  Transaction,
  Message,
  Review,
  Dispute,
  User,
  UserRole,
} from "@/types";
import type {
  AuthTokens,
  CreateDisputeDto,
  CreatePlatformAccountDto,
  CreateRequestDto,
  CreateReviewDto,
  ExchangeRate,
  KpiDashboard,
  KycDocument,
  KycStatusResponse,
  LoginDto,
  NotificationPrefs,
  AdminRevenueSummary,
  PlatformAccount,
  RatesCalculateResult,
  RegisterDto,
  TransactionFilters,
  UpdatePlatformAccountDto,
  UpdateUserDto,
  AdminCommissionSetting,
  AdminCommissionConfig,
  AdminCommissionPromo,
  CreateAdminCommissionPromoDto,
  PublicSettings,
} from "@/types/api-dtos";
import type { AppNotification } from "@/types/api-dtos";
import { getApiBaseUrl } from "@/lib/api-base";
import {
  normalizeTransactionDetailFromApi,
  normalizeTransactionFromApi,
} from "@/lib/normalize-transaction-api";
import { parseDecimalLike } from "@/lib/parse-decimal-json";

const api = axios.create({
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  config.baseURL = getApiBaseUrl();
  if (typeof window === "undefined") return config;
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      await signOut({ callbackUrl: "/connexion" });
    }
    return Promise.reject(error);
  },
);

function unwrapApi<T>(body: unknown): T {
  if (
    body !== null &&
    typeof body === "object" &&
    "data" in body &&
    "success" in body
  ) {
    return (body as ApiResponse<T>).data;
  }
  return body as T;
}

async function getUnwrapped<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<T> {
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
    if (v === undefined || v === "") continue;
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      out[k] = v;
    }
  }
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function normalizeAdminCommissionPromo(raw: unknown): AdminCommissionPromo | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id ?? raw.promo_id);
  const percent = parseDecimalLike(raw.percent ?? raw.promo_percent);
  const startsAt = String(raw.startsAt ?? raw.starts_at ?? "");
  const endsAt = String(raw.endsAt ?? raw.ends_at ?? "");
  const isActiveRaw = raw.isActive ?? raw.is_active;
  const isActive = isActiveRaw === true || isActiveRaw === "true";
  const isCurrentlyInWindowRaw =
    raw.isCurrentlyInWindow ?? raw.is_currently_in_window;
  const isCurrentlyInWindow =
    isCurrentlyInWindowRaw === true || isCurrentlyInWindowRaw === "true";

  if (!Number.isFinite(id) || id <= 0) return null;
  if (!Number.isFinite(percent) || percent < 0) return null;
  if (!startsAt || !endsAt) return null;

  return {
    id,
    percent,
    startsAt,
    endsAt,
    isActive,
    isCurrentlyInWindow: isCurrentlyInWindowRaw == null ? undefined : isCurrentlyInWindow,
  };
}

function normalizeAdminCommissionConfig(raw: unknown): AdminCommissionConfig {
  if (!isRecord(raw)) {
    return {
      commissionBasePercent: 0,
      commissionPromoPercent: null,
      commissionPromoEndsAt: null,
      commissionPercent: 0,
      isCommissionPromoActive: false,
      promo: null,
    };
  }

  const commissionBasePercent = parseDecimalLike(
    raw.commissionBasePercent ?? raw.commission_base_percent,
  );
  const commissionPromoPercent = parseDecimalLike(
    raw.commissionPromoPercent ?? raw.commission_promo_percent,
  );
  const commissionPercent = parseDecimalLike(
    raw.commissionPercent ?? raw.commission_percent,
  );
  const commissionPromoEndsAtRaw =
    raw.commissionPromoEndsAt ?? raw.commission_promo_ends_at;
  const isPromoActiveRaw =
    raw.isCommissionPromoActive ?? raw.is_commission_promo_active;

  const promo = normalizeAdminCommissionPromo(raw.promo ?? raw.promo_commission);

  return {
    commissionBasePercent:
      Number.isFinite(commissionBasePercent) && commissionBasePercent >= 0
        ? commissionBasePercent
        : 0,
    commissionPromoPercent:
      commissionPromoPercent == null
        ? null
        : Number.isFinite(commissionPromoPercent) && commissionPromoPercent >= 0
          ? commissionPromoPercent
          : null,
    commissionPromoEndsAt:
      typeof commissionPromoEndsAtRaw === "string" && commissionPromoEndsAtRaw
        ? commissionPromoEndsAtRaw
        : null,
    commissionPercent:
      Number.isFinite(commissionPercent) && commissionPercent >= 0
        ? commissionPercent
        : 0,
    isCommissionPromoActive: isPromoActiveRaw === true || isPromoActiveRaw === "true",
    promo,
  };
}

function normalizePublicSettings(raw: unknown): PublicSettings {
  if (!isRecord(raw)) {
    return {
      commissionBasePercent: 0,
      commissionPromoPercent: null,
      commissionPromoEndsAt: null,
      commissionPercent: 0,
      isCommissionPromoActive: false,
    };
  }

  const commissionBasePercent = parseDecimalLike(
    raw.commissionBasePercent ?? raw.commission_base_percent,
  );
  const commissionPromoPercent = parseDecimalLike(
    raw.commissionPromoPercent ?? raw.commission_promo_percent,
  );
  const commissionPercent = parseDecimalLike(
    raw.commissionPercent ?? raw.commission_percent,
  );
  const commissionPromoEndsAtRaw =
    raw.commissionPromoEndsAt ?? raw.commission_promo_ends_at;
  const isPromoActiveRaw =
    raw.isCommissionPromoActive ?? raw.is_commission_promo_active;

  return {
    commissionBasePercent:
      Number.isFinite(commissionBasePercent) && commissionBasePercent >= 0
        ? commissionBasePercent
        : 0,
    commissionPromoPercent:
      commissionPromoPercent == null
        ? null
        : Number.isFinite(commissionPromoPercent) && commissionPromoPercent >= 0
          ? commissionPromoPercent
          : null,
    commissionPromoEndsAt:
      typeof commissionPromoEndsAtRaw === "string" && commissionPromoEndsAtRaw
        ? commissionPromoEndsAtRaw
        : null,
    commissionPercent:
      Number.isFinite(commissionPercent) && commissionPercent >= 0
        ? commissionPercent
        : 0,
    isCommissionPromoActive: isPromoActiveRaw === true || isPromoActiveRaw === "true",
  };
}

function extractExchangeRequestList(raw: unknown): ExchangeRequest[] {
  const inner = unwrapApi<unknown>(raw);
  if (Array.isArray(inner)) return inner as ExchangeRequest[];
  if (isRecord(inner) && Array.isArray(inner.items)) {
    return inner.items as ExchangeRequest[];
  }
  if (isRecord(inner) && Array.isArray(inner.data)) {
    return inner.data as ExchangeRequest[];
  }
  return [];
}

interface RateHistoryRow {
  fromCurrency?: string;
  toCurrency?: string;
  rate?: unknown;
  fetchedAt?: string;
}

function trendFromHistory(rows: RateHistoryRow[]): "up" | "down" | "stable" {
  const series = rows
    .filter((r) => r.fromCurrency === "XOF" && r.toCurrency === "RUB")
    .sort(
      (a, b) =>
        new Date(a.fetchedAt ?? 0).getTime() -
        new Date(b.fetchedAt ?? 0).getTime(),
    )
    .map((r) => parseDecimalLike(r.rate))
    .filter((n) => n > 0);
  if (series.length < 2) return "stable";
  const a = series[series.length - 2]!;
  const b = series[series.length - 1]!;
  const rel = (b - a) / a;
  if (rel > 0.00005) return "up";
  if (rel < -0.00005) return "down";
  return "stable";
}

function trendFromApi(
  raw: Record<string, unknown>,
  fallback: "up" | "down" | "stable",
): "up" | "down" | "stable" {
  const t = raw.trend;
  if (t === "up" || t === "down" || t === "stable") return t;
  return fallback;
}

/**
 * GET /rates/current — forme actuelle : `rate`, `rubPerXof`, `rateWithSpread`, `trend`, `percentChange24h`, …
 * Ancienne forme encore acceptée : `XOF_RUB` / `RUB_XOF`.
 */
function mapCurrentToExchangeRate(
  raw: Record<string, unknown>,
  trendFallback: "up" | "down" | "stable",
): ExchangeRate {
  const fetchedAt =
    typeof raw.fetchedAt === "string"
      ? raw.fetchedAt
      : new Date().toISOString();

  const rateNew = parseDecimalLike(raw.rate);
  const rubPerXof = parseDecimalLike(raw.rubPerXof);
  const rateWithSpread = parseDecimalLike(raw.rateWithSpread);
  const rubWs = parseDecimalLike(raw.rubPerXofWithSpread);
  const pct = parseDecimalLike(raw.percentChange24h ?? raw.percentChange);
  const commissionPercent = parseDecimalLike(
    raw.commissionPercent ?? raw.commission_percent,
  );
  const source = typeof raw.source === "string" ? raw.source : undefined;

  if (Number.isFinite(rateNew) && rateNew > 0) {
    const inv =
      Number.isFinite(rubPerXof) && rubPerXof > 0 ? rubPerXof : 1 / rateNew;
    return {
      rate: rateNew,
      inverseRate: inv,
      fromCurrency: "XOF",
      toCurrency: "RUB",
      trend: trendFromApi(raw, trendFallback),
      percentChange: Number.isFinite(pct) ? pct : 0,
      fetchedAt,
      rateWithSpread:
        Number.isFinite(rateWithSpread) && rateWithSpread > 0
          ? rateWithSpread
          : undefined,
      rubPerXofWithSpread:
        Number.isFinite(rubWs) && rubWs > 0 ? rubWs : undefined,
      commissionPercent:
        Number.isFinite(commissionPercent) && commissionPercent >= 0
          ? commissionPercent
          : undefined,
      source,
    };
  }

  const xofRub = Number(raw.XOF_RUB);
  const rubXof = Number(raw.RUB_XOF);
  const rate = Number.isFinite(xofRub) ? xofRub : 0;
  const inverse = Number.isFinite(rubXof) ? rubXof : 0;
  return {
    rate,
    inverseRate: inverse,
    fromCurrency: "XOF",
    toCurrency: "RUB",
    trend: trendFromApi(raw, trendFallback),
    percentChange: Number.isFinite(pct) ? pct : 0,
    fetchedAt,
  };
}

function extractTransactionList(raw: unknown): Transaction[] {
  let rows: unknown[] = [];
  if (raw == null) return [];
  if (Array.isArray(raw)) rows = raw;
  else if (isRecord(raw)) {
    if (Array.isArray(raw.items)) rows = raw.items;
    else if (Array.isArray(raw.data)) rows = raw.data;
  }
  return rows.map((row) => normalizeTransactionFromApi(row));
}

function extractUserList(raw: unknown): User[] {
  if (Array.isArray(raw)) return raw as User[];
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items as User[];
  if (isRecord(raw) && Array.isArray(raw.data)) return raw.data as User[];
  return [];
}

// ─── AUTH ───────────────────────────────────────────────────────────────────

export const authApi = {
  register: (dto: RegisterDto) => api.post<unknown>("/auth/register", dto),
  login: (dto: LoginDto) => api.post<unknown>("/auth/login", dto),
  sendOtp: (phone: string) => api.post("/auth/otp/send", { phone }),
  verifyOtp: (phone: string, code: string) =>
    api.post("/auth/otp/verify", { phone, code }),
  logout: () => api.post("/auth/logout"),
  refresh: (refreshToken: string) =>
    postUnwrapped<AuthTokens>("/auth/refresh", { refreshToken }),
  me: () => getUnwrapped<User>("/auth/me"),
};

// ─── USERS ──────────────────────────────────────────────────────────────────

export const usersApi = {
  updateMe: (dto: UpdateUserDto) => putUnwrapped<User>("/users/me", dto),
  deleteMe: () => deleteUnwrapped("/users/me"),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return api
      .post<unknown>("/users/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => unwrapApi<{ avatar: string }>(r.data));
  },
  getProfile: (id: number) => getUnwrapped<User>(`/users/${id}`),
  getReviews: async (id: number): Promise<Review[]> => {
    const { data } = await api.get<unknown>(`/users/${id}/reviews`);
    const inner = unwrapApi<unknown>(data);
    if (Array.isArray(inner)) return inner as Review[];
    if (isRecord(inner) && Array.isArray(inner.data))
      return inner.data as Review[];
    return [];
  },
  listAll: async (params?: Record<string, string>): Promise<User[]> => {
    const { data } = await api.get<unknown>("/users", { params });
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
    form.append("docType", payload.docType);
    form.append("front", payload.front);
    form.append("back", payload.back);
    form.append("selfie", payload.selfie);
    return api
      .post<unknown>("/kyc/submit", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => unwrapApi<unknown>(r.data));
  },
  getStatus: () => getUnwrapped<KycStatusResponse>("/kyc/status"),
  /**
   * [Admin] PUT `/kyc/admin/:userId/approve` — URL complète avec base : `/api/v1/kyc/admin/{id}/approve`.
   * Le `id` du path est l’**identifiant utilisateur**, pas l’id du document KYC.
   */
  approve: (userId: number) => api.put(`/kyc/admin/${userId}/approve`),
  /**
   * [Admin] PUT `/kyc/admin/:userId/reject` — même convention d’`id` utilisateur.
   * Corps `{ note }` si fourni (selon ton DTO Nest).
   */
  reject: (userId: number, note?: string) =>
    api.put(
      `/kyc/admin/${userId}/reject`,
      note?.trim() ? { note: note.trim() } : {},
    ),
};

// ─── DEMANDES CLIENT ────────────────────────────────────────────────────────

/** Corps strict pour `forbidNonWhitelisted` (Nest) : aucune clé en trop. */
function bodyCreateRequest(dto: CreateRequestDto): CreateRequestDto {
  const body: CreateRequestDto = {
    type: dto.type,
    amountWanted: dto.amountWanted,
    paymentMethod: dto.paymentMethod,
    phoneToSend: dto.phoneToSend,
  };
  const note = dto.note?.trim();
  if (note) body.note = note;
  return body;
}

export const requestsApi = {
  create: (dto: CreateRequestDto) =>
    postUnwrapped<ExchangeRequest>("/requests", bodyCreateRequest(dto)),

  mine: async (): Promise<ExchangeRequest[]> => {
    const { data } = await api.get<unknown>("/requests/mine");
    return extractExchangeRequestList(data);
  },

  getById: (id: number) => getUnwrapped<ExchangeRequest>(`/requests/${id}`),

  cancel: (id: number) => deleteUnwrapped(`/requests/${id}`),
};

// ─── PREUVES (JWT, blob) ─────────────────────────────────────────────────────

export const proofsApi = {
  /** GET /proofs/:filename — Authorization comme le reste de l’API. */
  getBlob: async (
    filename: string,
  ): Promise<{ blob: Blob; contentType: string }> => {
    const { data, headers } = await api.get<Blob>(
      `/proofs/${encodeURIComponent(filename)}`,
      { responseType: "blob" },
    );
    const contentType =
      String(headers["content-type"] ?? "")
        .split(";")[0]
        ?.trim() ?? "";
    return { blob: data, contentType };
  },
};

// ─── TRANSACTIONS CLIENT ────────────────────────────────────────────────────

export const transactionsApi = {
  list: async (params?: TransactionFilters): Promise<Transaction[]> => {
    const { data } = await api.get<unknown>("/transactions", {
      params: params
        ? stripUndefined(params as Record<string, unknown>)
        : undefined,
    });
    return extractTransactionList(unwrapApi(data));
  },

  getById: (id: number) =>
    getUnwrapped<unknown>(`/transactions/${id}`).then(
      normalizeTransactionFromApi,
    ),

  clientSend: (id: number, proofFile: File) => {
    const form = new FormData();
    form.append("proof", proofFile);
    return api.post<unknown>(`/transactions/${id}/client-send`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  clientConfirm: (id: number) =>
    postUnwrapped<unknown>(`/transactions/${id}/client-confirm`),

  dispute: (id: number, dto: CreateDisputeDto) =>
    postUnwrapped<unknown>(`/transactions/${id}/dispute`, dto),
};

// ─── CHAT ───────────────────────────────────────────────────────────────────

export const chatApi = {
  getMessages: (transactionId: number) =>
    getUnwrapped<Message[]>(`/chat/transactions/${transactionId}/messages`),

  sendMessage: (
    transactionId: number,
    content: string,
    type: "TEXT" | "IMAGE" = "TEXT",
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
  getForUser: (userId: number) =>
    getUnwrapped<Review[]>(`/reviews/users/${userId}`),
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
    form.append("file", file);
    return api.post(`/disputes/${id}/attachments`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  adminList: () => getUnwrapped<Dispute[]>("/disputes/admin"),

  adminResolve: (id: number, resolution: string) =>
    api.put(`/disputes/admin/${id}/resolve`, { resolution }),
};

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────

export const notificationsApi = {
  list: () => getUnwrapped<AppNotification[]>("/notifications"),
  markAllRead: () => api.put("/notifications/read-all"),
  markOneRead: (id: number) => api.put(`/notifications/${id}/read`),
  delete: (id: number) => api.delete(`/notifications/${id}`),
  getPrefs: () => getUnwrapped<NotificationPrefs>("/notifications/preferences"),
  updatePrefs: (prefs: Partial<NotificationPrefs>) =>
    putUnwrapped<NotificationPrefs>("/notifications/preferences", prefs),
};

// ─── RATES ──────────────────────────────────────────────────────────────────

export const ratesApi = {
  current: async (): Promise<ExchangeRate> => {
    const { data } = await api.get<unknown>("/rates/current");
    const raw = unwrapApi<Record<string, unknown>>(data);
    return mapCurrentToExchangeRate(raw, "stable");
  },

  /** Taux : tendance prioritaire depuis l’API, sinon historique. */
  currentWithTrend: async (): Promise<ExchangeRate> => {
    const [currentRes, historyRes] = await Promise.all([
      api.get<unknown>("/rates/current"),
      api.get<unknown>("/rates/history"),
    ]);
    const raw = unwrapApi<Record<string, unknown>>(currentRes.data);
    const histRaw = unwrapApi<unknown>(historyRes.data);
    const histRows = Array.isArray(histRaw)
      ? (histRaw as RateHistoryRow[])
      : [];
    const trendHist = trendFromHistory(histRows);
    const trend =
      raw.trend === "up" || raw.trend === "down" || raw.trend === "stable"
        ? raw.trend
        : trendHist;
    return mapCurrentToExchangeRate(raw, trend);
  },

  history: async (): Promise<RateHistoryRow[]> => {
    const { data } = await api.get<unknown>("/rates/history");
    const inner = unwrapApi<unknown>(data);
    return Array.isArray(inner) ? (inner as RateHistoryRow[]) : [];
  },

  /**
   * `amount` en **plus petite unité** : centimes (XOF) ou kopecks (RUB).
   * Ex. 1000 RUB affichés → `amount = 100_000`, `from = RUB`.
   */
  calculate: (amount: number, from: "XOF" | "RUB", to: "XOF" | "RUB") =>
    getUnwrapped<RatesCalculateResult>("/rates/calculate", {
      amount: String(amount),
      from,
      to,
    }),
};

// ─── SETTINGS (PUBLIC) ───────────────────────────────────────────────────────

export const settingsApi = {
  public: async () => {
    const raw = await getUnwrapped<unknown>("/settings/public");
    return normalizePublicSettings(raw);
  },
};

// ─── OPÉRATEUR ───────────────────────────────────────────────────────────────

export const operatorApi = {
  getPendingRequests: async (): Promise<ExchangeRequest[]> => {
    const { data } = await api.get<unknown>("/operator/requests");
    return extractExchangeRequestList(data);
  },

  getRequestDetail: (id: number) =>
    getUnwrapped<ExchangeRequest>(`/operator/requests/${id}`),

  takeRequest: (
    id: number,
    dto: { operatorPaymentNumber: string; operatorNote?: string },
  ) =>
    postUnwrapped<unknown>(`/operator/requests/${id}/take`, dto).then(
      normalizeTransactionFromApi,
    ),

  getMyTransactions: async (
    filters?: TransactionFilters,
  ): Promise<Transaction[]> => {
    const { data } = await api.get<unknown>("/operator/transactions", {
      params: filters
        ? stripUndefined(filters as Record<string, unknown>)
        : undefined,
    });
    return extractTransactionList(unwrapApi(data));
  },

  getTransactionDetail: (id: number) =>
    getUnwrapped<unknown>(`/operator/transactions/${id}`).then(
      normalizeTransactionDetailFromApi,
    ),

  verifyClientProof: (id: number) =>
    api.post(`/operator/transactions/${id}/confirm-platform-transfer

`),

  operatorSend: (id: number, proofFile: File) => {
    const form = new FormData();
    form.append("proof", proofFile);
    return api.post<unknown>(`/operator/transactions/${id}/send`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  addNote: (id: number, note: string) =>
    api.post(`/operator/transactions/${id}/note`, { note }),

  cancel: (id: number, reason: string) =>
    api.post(`/operator/transactions/${id}/cancel`, { reason }),
};

// ─── ADMIN ──────────────────────────────────────────────────────────────────

export const adminApi = {
  dashboard: () => getUnwrapped<KpiDashboard>("/admin/dashboard"),

  allUsers: (params?: Record<string, string>) =>
    getUnwrapped<User[]>("/admin/users", params as Record<string, unknown>),

  /** @deprecated Utiliser allUsers */
  users: (params?: Record<string, string>) =>
    getUnwrapped<User[]>("/admin/users", params as Record<string, unknown>),

  banUser: (id: number) => api.put(`/admin/users/${id}/ban`),

  assignRole: (userId: number, role: UserRole) =>
    api.put(`/admin/users/${userId}/role`, { role }),

  listOperators: () => getUnwrapped<User[]>("/admin/operators"),

  revokeOperator: (userId: number) => api.delete(`/admin/operators/${userId}`),

  allRequests: async (params?: Record<string, string>) => {
    const { data } = await api.get<unknown>("/admin/requests", { params });
    return extractExchangeRequestList(data);
  },

  pendingRequests: async () => {
    const { data } = await api.get<unknown>("/admin/requests/pending");
    return extractExchangeRequestList(data);
  },

  allTransactions: (params?: Record<string, string>) =>
    getUnwrapped<Transaction[]>(
      "/admin/transactions",
      params as Record<string, unknown>,
    ),

  /** @deprecated Utiliser allTransactions */
  transactions: (params?: Record<string, string>) =>
    getUnwrapped<Transaction[]>(
      "/admin/transactions",
      params as Record<string, unknown>,
    ),

  disputes: () => getUnwrapped<Dispute[]>("/admin/disputes"),

  resolveDispute: (id: number, resolution: string) =>
    api.put(`/admin/disputes/${id}/resolve`, { resolution }),

  kycPending: () => getUnwrapped<KycDocument[]>("/admin/kyc/pending"),

  approveKyc: (userId: number) => kycApi.approve(userId),

  rejectKyc: (userId: number, note?: string) => kycApi.reject(userId, note),

  /** Numéros / IBAN de réception DoniSend (admin). */
  platformAccounts: () =>
    getUnwrapped<PlatformAccount[]>("/admin/platform-accounts"),

  createPlatformAccount: (dto: CreatePlatformAccountDto) =>
    postUnwrapped<PlatformAccount>("/admin/platform-accounts", dto),

  updatePlatformAccount: (id: number, dto: UpdatePlatformAccountDto) =>
    putUnwrapped<PlatformAccount>(`/admin/platform-accounts/${id}`, dto),

  deletePlatformAccount: (id: number) =>
    deleteUnwrapped(`/admin/platform-accounts/${id}`),

  revenueSummary: () =>
    getUnwrapped<AdminRevenueSummary>("/admin/revenue/summary"),

  getCommissionSetting: () =>
    getUnwrapped<AdminCommissionSetting>("/admin/settings/commission"),

  updateCommissionSetting: (percent: number) =>
    putUnwrapped<AdminCommissionSetting>("/admin/settings/commission", {
      percent,
    }),

  getCommissionConfig: () =>
    getUnwrapped<unknown>("/admin/settings/commission/config").then(
      normalizeAdminCommissionConfig,
    ),

  createCommissionPromo: (dto: CreateAdminCommissionPromoDto) =>
    postUnwrapped<AdminCommissionPromo>("/admin/settings/commission/promo", dto),

  listCommissionPromos: (onlyActive?: boolean) =>
    getUnwrapped<unknown[]>("/admin/settings/commission/promo", {
      ...(onlyActive ? { onlyActive: "true" } : {}),
    }).then((rows) =>
      Array.isArray(rows)
        ? (rows
            .map(normalizeAdminCommissionPromo)
            .filter(Boolean) as AdminCommissionPromo[]).sort((a, b) => {
            const aw = a.isCurrentlyInWindow === true ? 1 : 0;
            const bw = b.isCurrentlyInWindow === true ? 1 : 0;
            if (aw !== bw) return bw - aw; // d'abord les promos applicables maintenant

            const as = new Date(a.startsAt).getTime();
            const bs = new Date(b.startsAt).getTime();
            if (Number.isFinite(as) && Number.isFinite(bs) && as !== bs) return bs - as;

            return b.id - a.id; // fallback: la plus récente
          })
        : [],
    ),

  deleteCommissionPromo: (id: number) =>
    deleteUnwrapped<void>(`/admin/settings/commission/promo/${id}`),
};

export default api;
