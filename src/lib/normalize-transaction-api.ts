import type { ExchangeRequest } from '@/types/request';
import type { TransactionDetail } from '@/types/operator';
import type { Transaction } from '@/types/transaction';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function strOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
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
  /** Clé brute (`proofs/uuid.ext`) — affichage via GET /proofs/:filename + Bearer. */
  return {
    ...base,
    clientProofUrl: rawClientProof,
    operatorProofUrl: rawOperatorProof,
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
