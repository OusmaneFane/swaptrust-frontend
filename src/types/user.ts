export type UserRole = 'CLIENT' | 'OPERATOR' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  phoneMali: string | null;
  phoneRussia: string | null;
  countryResidence: 'MALI' | 'RUSSIA' | 'OTHER';
  ratingAvg: number;
  transactionsCount: number;
  avatar: string | null;
  isBanned: boolean;
  createdAt: string;
}
