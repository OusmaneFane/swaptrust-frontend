/**
 * En base : `proofs/<filename>` avec filename = `uuid.ext`.
 * GET /api/v1/proofs/:filename
 */
export function extractProofFilename(stored: string | null | undefined): string | null {
  if (stored == null) return null;
  const s = String(stored).trim();
  if (!s) return null;

  const pathOnly = s.split('?')[0]!.replace(/^https?:\/\/[^/]+/i, '');
  const parts = pathOnly.split('/').filter(Boolean);
  const proofsIdx = parts.findIndex((p) => p.toLowerCase() === 'proofs');
  if (proofsIdx >= 0 && parts[proofsIdx + 1]) {
    const name = parts[proofsIdx + 1]!;
    if (name.includes('..') || name.includes('/')) return null;
    return name;
  }

  const last = parts[parts.length - 1];
  if (
    last &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpe?g|png|webp|pdf)$/i.test(
      last,
    )
  ) {
    return last;
  }

  return null;
}
