import type { Review } from '@/types';
import { usersApi } from '@/services/api';

export async function fetchUserReviews(userId: number): Promise<Review[]> {
  return usersApi.getReviews(userId);
}
