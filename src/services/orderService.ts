/**
 * Anciennes routes « ordres » remplacées par `requestsApi` (`@/services/api`).
 */
import type { CreateRequestDto } from '@/types/api-dtos';
import { requestsApi } from '@/services/api';

export type { CreateRequestDto };

export async function fetchMyRequests() {
  return requestsApi.mine();
}

export async function createRequest(body: CreateRequestDto) {
  return requestsApi.create(body);
}
