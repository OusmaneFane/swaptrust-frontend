/**
 * Affichage « 1 000 F CFA ≈ X ₽ » à partir du `rate` GET /rates/current
 * (₽ majeurs pour 1 F CFA). Compat : anciens taux stockés avec autre échelle (rate ≥ 1).
 */
export function rubDisplayFor1000Cfa(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return '—';
  if (rate < 1) return (1000 * rate).toFixed(2);
  return ((1000 * rate) / 100).toFixed(2);
}
