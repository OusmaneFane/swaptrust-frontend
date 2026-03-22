import axios from 'axios';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function formatOrderCreateError(err: unknown): string {
  if (!axios.isAxiosError(err)) return 'Publication impossible';
  const d = err.response?.data as Record<string, unknown> | string | undefined;
  if (typeof d === 'string' && d.trim()) return d;
  if (d && typeof d === 'object') {
    const msg = d.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(d.message)) return d.message.join(', ');
    const errArr = d.errors;
    if (Array.isArray(errArr)) return errArr.map(String).join(', ');
    if (isRecord(errArr)) {
      const parts = Object.entries(errArr).map(
        ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`,
      );
      if (parts.length) return parts.join(' · ');
    }
  }
  if (err.response?.status === 400) {
    return 'Données invalides (vérifiez montant et champs).';
  }
  return 'Publication impossible';
}
