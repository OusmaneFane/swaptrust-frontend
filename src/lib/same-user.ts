/** Compare deux identifiants utilisateur (nombre, UUID string, etc.). */
export function sameUserId(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): boolean {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}
