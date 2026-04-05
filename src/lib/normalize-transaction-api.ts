import type { PaymentMethod } from '@/types/order';
import type { ExchangeRequest } from '@/types/request';
import type { TransactionDetail } from '@/types/operator';
import type { PlatformReceiveAccount, Transaction } from '@/types/transaction';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function strOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function minorOrUndef(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
  if (typeof v === 'string' && v !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return undefined;
}

function rateOrUndef(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function percentOrUndef(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function normalizePlatformAccount(raw: unknown): PlatformReceiveAccount | null {
  if (raw == null || !isRecord(raw)) return null;
  const num =
    strOrNull(raw.accountNumber ?? raw.account_number) ??
    (raw.accountNumber != null && String(raw.accountNumber).trim() !== ''
      ? String(raw.accountNumber).trim()
      : null);
  if (!num) return null;
  const id = minorOrUndef(raw.id);
  return {
    ...(id != null ? { id } : {}),
    accountNumber: num,
    accountName: String(raw.accountName ?? raw.account_name ?? 'SwapTrust'),
    method: (raw.method as PaymentMethod) ?? undefined,
  };
}

/**
 * Nest / serializers : `client_proof_url`, ancien `proof_url`, ou camelCase.
 */
export function normalizeTransactionFromApi(raw: unknown): Transaction {
  const o = isRecord(raw) ? raw : {};
  const base = { ...o } as unknown as Transaction;
  const rawClientProof = strOrNull(
    o.clientProofUrl ??
      o.client_proof_url ??
      o.proofUrl ??
      o.proof_url ??
      base.clientProofUrl,
  );
  const rawOperatorProof = strOrNull(
    o.operatorProofUrl ?? o.operator_proof_url ?? base.operatorProofUrl,
  );
  const req = isRecord(o.request) ? o.request : null;
  const paymentMethod = (o.paymentMethod ??
    o.payment_method ??
    req?.paymentMethod ??
    req?.payment_method) as PaymentMethod | undefined;
  const platformAccount = normalizePlatformAccount(
    o.platformAccount ?? o.platform_account,
  );
  /** Clé brute (`proofs/uuid.ext`) — affichage via GET /proofs/:filename + Bearer. */
  return {
    ...base,
    clientProofUrl: rawClientProof,
    operatorProofUrl: rawOperatorProof,
    ...(paymentMethod ? { paymentMethod } : {}),
    grossAmount: minorOrUndef(o.grossAmount ?? o.gross_amount) ?? base.grossAmount,
    netAmount: minorOrUndef(o.netAmount ?? o.net_amount) ?? base.netAmount,
    googleRate: rateOrUndef(o.googleRate ?? o.google_rate) ?? base.googleRate,
    commissionPercent:
      percentOrUndef(o.commissionPercent ?? o.commission_percent) ??
      base.commissionPercent,
    ...(platformAccount ? { platformAccount } : {}),
    platformToOperatorProofUrl:
      strOrNull(
        o.platformToOperatorProofUrl ?? o.platform_to_operator_proof_url,
      ) ?? base.platformToOperatorProofUrl,
    platformTransferredAt:
      strOrNull(o.platformTransferredAt ?? o.platform_transferred_at) ??
      base.platformTransferredAt,
  };
}

export function normalizeTransactionDetailFromApi(raw: unknown): TransactionDetail {
  const base = normalizeTransactionFromApi(raw);
  const o = isRecord(raw) ? raw : {};
  const br = base as unknown as Record<string, unknown>;
  const logs =
    o.operatorLogs ??
    o.operator_logs ??
    br.operatorLogs ??
    br.operator_logs;
  const requestRaw = o.request ?? br.request;
  return {
    ...base,
    operatorLogs: Array.isArray(logs)
      ? (logs as TransactionDetail['operatorLogs'])
      : [],
    request: isRecord(requestRaw)
      ? (requestRaw as unknown as ExchangeRequest)
      : ({} as ExchangeRequest),
  } as TransactionDetail;
}
