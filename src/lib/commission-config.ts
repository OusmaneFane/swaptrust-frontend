/**
 * Commission plateforme affichée côté client (alignée sur COMMISSION_PERCENT backend).
 * Utiliser uniquement des variables `NEXT_PUBLIC_*` pour le bundle navigateur.
 */
export function getPublicCommissionPercent(): number {
  const n = Number(process.env.NEXT_PUBLIC_COMMISSION_PERCENT);
  if (Number.isFinite(n) && n > 0 && n <= 100) return n;
  return 2;
}
