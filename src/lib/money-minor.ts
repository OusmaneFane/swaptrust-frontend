/** Conversion affichage majeur → unité minoritaire (centimes CFA ou kopecks RUB). */
export function majorToMinor(majorUnits: number): number {
  if (!Number.isFinite(majorUnits) || majorUnits <= 0) return 0;
  return Math.round(majorUnits * 100);
}

/** Plancher API typique @Min(100) sur amountWanted (minor). */
export const MIN_REQUEST_AMOUNT_MINOR = 100;

/**
 * Fourchettes indicatives côté serveur pour le net CFA (centimes), NEED_RUB.
 * (À ajuster si ton Nest expose des constantes publiques.)
 */
export const TYPICAL_MIN_NET_XOF_CENTIMES = 500_000; // 5 000 F
export const TYPICAL_MAX_NET_XOF_CENTIMES = 50_000_000; // 500 000 F

export function isNetXofOutsideTypicalRange(netXofCentimes: number): boolean {
  return (
    netXofCentimes < TYPICAL_MIN_NET_XOF_CENTIMES ||
    netXofCentimes > TYPICAL_MAX_NET_XOF_CENTIMES
  );
}
