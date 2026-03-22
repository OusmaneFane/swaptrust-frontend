import type { User } from './user';

export interface Review {
  id: number;
  author: User;
  targetUserId: number;
  rating: number;
  comment: string | null;
  transactionId: number;
  createdAt: string;
}
