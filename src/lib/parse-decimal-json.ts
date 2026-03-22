/**
 * Parse les nombres renvoyés par l’API (number, string, ou objet style Prisma Decimal { s, e, d }).
 * Le tableau `d` est en base 10^7, **least significant digit first** (comme decimal.js).
 */
export function parseDecimalLike(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  if (v && typeof v === 'object' && 'd' in v && Array.isArray((v as { d: unknown }).d)) {
    return prismaDecimalJsonToNumber(v as { s?: number; e?: number; d: number[] });
  }
  return 0;
}

function prismaDecimalJsonToNumber(o: { s?: number; e?: number; d: number[] }): number {
  const { d } = o;
  const e = o.e ?? 0;
  const s = o.s ?? 1;
  if (!d?.length) return 0;
  let coeff = 0;
  for (let i = 0; i < d.length; i++) {
    coeff += d[i]! * Math.pow(1e7, i);
  }
  if (coeff === 0) return 0;
  const digitCount = Math.floor(Math.log10(coeff)) + 1;
  const sign = s < 0 ? -1 : 1;
  return sign * coeff * Math.pow(10, e - (digitCount - 1));
}
