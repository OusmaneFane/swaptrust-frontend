const DEFAULT = 'http://localhost:3001/api/v1';

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

/**
 * URL de base de l’API Nest (avec préfixe /api/v1).
 * Côté serveur : préfère `API_URL` (lu à l’exécution, fiable pour authorize / RSC).
 * Côté client : `NEXT_PUBLIC_API_URL`.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return trimSlash(process.env.NEXT_PUBLIC_API_URL ?? DEFAULT);
  }
  const fromServer = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  return trimSlash(fromServer ?? DEFAULT);
}
