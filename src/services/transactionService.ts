import type { Transaction } from '@/types';
import type { TransactionFilters } from '@/types/api-dtos';
import { transactionsApi } from '@/services/api';

export type { TransactionFilters } from '@/types/api-dtos';

export async function fetchTransaction(id: number): Promise<Transaction> {
  return transactionsApi.getById(id);
}

export async function fetchTransactions(
  params?: TransactionFilters,
): Promise<{ items: Transaction[] }> {
  const items = await transactionsApi.list(params);
  return { items };
}

export async function clientSendProof(
  id: number,
  proofFile: File,
): Promise<void> {
  await transactionsApi.clientSend(id, proofFile);
}

export async function clientConfirmReceive(id: number): Promise<void> {
  await transactionsApi.clientConfirm(id);
}
