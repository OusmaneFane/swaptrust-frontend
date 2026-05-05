import type { User } from '@/types/user';

/** Numéro utilisé pour les toasts « notification envoyée » (backend / profil). */
export function userWhatsappNotifyPhone(
  user: Pick<User, 'phone' | 'whatsappPhone' | 'phoneMali' | 'phoneRussia'> | null | undefined,
): string | null {
  if (!user) return null;
  return user.phone ?? user.whatsappPhone ?? user.phoneMali ?? user.phoneRussia ?? null;
}
