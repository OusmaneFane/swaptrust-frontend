export interface User {
  id: number;
  name: string;
  email: string;
  phoneMali: string | null;
  phoneRussia: string | null;
  countryResidence: 'MALI' | 'RUSSIA' | 'OTHER';
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  ratingAvg: number;
  transactionsCount: number;
  avatar: string | null;
  isAdmin: boolean;
  createdAt: string;
}
