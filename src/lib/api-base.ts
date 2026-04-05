/** Appels serveur → Nest (authorize, fetchAuthMe…). Pas d’origine navigateur. */
const DEFAULT_SERVER = 'http://localhost:3001/api/v1';

/**
 * Navigateur : même origine que le front → rewrite Next (`next.config.mjs`)
 * `/api/backend/:path*` → `${API_URL}/:path*`. Évite le CORS (requête « sans réponse »).
 * Surcharge : définir `NEXT_PUBLIC_API_URL` pour pointer directement vers l’API
 * (il faut alors autoriser l’origine du front côté Nest).
 */
const CLIENT_PROXY_BASE = '/api/backend';

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

/**
 * URL de base de l’API Nest (chemin API après `/api/v1`, ex. `/requests`).
 * - **Client** : proxy `/api/backend` par défaut ; ou `NEXT_PUBLIC_API_URL` si défini.
 * - **Serveur** : `API_URL` ou `NEXT_PUBLIC_API_URL`, sinon localhost.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const direct = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (direct) return trimSlash(direct);
    return CLIENT_PROXY_BASE;
  }
  const fromServer = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  return trimSlash(fromServer ?? DEFAULT_SERVER);
}
