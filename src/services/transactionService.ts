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

export async function confirmSend(
  id: number,
  proofFile: File,
): Promise<Transaction> {
  return transactionsApi.confirmSend(id, proofFile);
}

export async function confirmReceive(id: number): Promise<Transaction> {
  return transactionsApi.confirmReceive(id);
}

export async function cancelTransaction(id: number): Promise<Transaction> {
  return transactionsApi.cancel(id);
}
