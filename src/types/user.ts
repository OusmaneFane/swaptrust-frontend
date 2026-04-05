export type UserRole = 'CLIENT' | 'OPERATOR' | 'ADMIN';

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  kycStatus: KycStatus;
  phoneMali: string | null;
  phoneRussia: string | null;
  /** Numéro WhatsApp actif côté backend (souvent égal à l’un des deux). */
  whatsappPhone: string | null;
  countryResidence: 'MALI' | 'RUSSIA' | 'OTHER';
  ratingAvg: number;
  transactionsCount: number;
  avatar: string | null;
  isBanned: boolean;
  createdAt: string;
}
