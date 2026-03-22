import type { Order } from '@/types/order';
import { parseDecimalLike } from '@/lib/parse-decimal-json';
import type { User } from '@/types/user';
import type { OrderApiRaw } from '@/types/order-api';

function normalizeAmount(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
  return 0;
}

function normalizeRate(v: unknown): number {
  return parseDecimalLike(v);
}

function isKycStatus(
  v: unknown,
): v is User['kycStatus'] {
  return (
    v === 'NOT_SUBMITTED' ||
    v === 'PENDING' ||
    v === 'VERIFIED' ||
    v === 'REJECTED'
  );
}

function listUserToUser(raw: OrderApiRaw): User {
  const u = raw.user;
  const id = u?.id ?? raw.userId;
  return {
    id,
    name: u?.name ?? 'Utilisateur',
    email: typeof u?.email === 'string' ? u.email : '',
    phoneMali: null,
    phoneRussia: null,
    countryResidence: 'OTHER',
    kycStatus: isKycStatus(u?.kycStatus) ? u.kycStatus : 'NOT_SUBMITTED',
    ratingAvg: typeof u?.ratingAvg === 'number' ? u.ratingAvg : 0,
    transactionsCount: 0,
    avatar: typeof u?.avatar === 'string' ? u.avatar : null,
    isAdmin: false,
    createdAt: '',
  };
}

export function normalizeOrderFromApi(raw: OrderApiRaw): Order {
  return {
    id: raw.id,
    user: listUserToUser(raw),
    type: raw.type,
    amountFrom: normalizeAmount(raw.amountFrom),
    currencyFrom: raw.currencyFrom,
    amountTo: normalizeAmount(raw.amountTo),
    currencyTo: raw.currencyTo,
    rate: normalizeRate(raw.rate),
    commission: normalizeAmount(raw.commission),
    paymentMethod: raw.paymentMethod,
    phoneReceive:
      typeof raw.phoneReceive === 'string' && raw.phoneReceive.trim()
        ? raw.phoneReceive.trim()
        : '',
    note: raw.note,
    status: raw.status,
    expiresAt: raw.expiresAt,
    createdAt: raw.createdAt,
  };
}
