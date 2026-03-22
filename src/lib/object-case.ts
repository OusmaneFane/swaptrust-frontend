/** `amountFrom` → `amount_from` (JSON Nest courant). */
export function keysToSnakeCase(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const snake = k.replace(/([A-Z])/g, '_$1').toLowerCase();
    out[snake] = v;
  }
  return out;
}
