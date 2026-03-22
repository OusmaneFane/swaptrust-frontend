import type { Dispute } from '@/types';
import type { CreateDisputeDto } from '@/types/api-dtos';
import { disputesApi } from '@/services/api';

export async function openDispute(
  transactionId: number,
  reason: string,
): Promise<Dispute> {
  const dto: CreateDisputeDto = { reason };
  return disputesApi.open(transactionId, dto);
}

export async function fetchDisputesAdmin(): Promise<Dispute[]> {
  return disputesApi.adminList();
}
