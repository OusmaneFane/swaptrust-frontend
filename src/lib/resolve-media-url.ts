import { getApiBaseUrl } from '@/lib/api-base';

/**
 * Chemins de preuves / pièces : le backend Nest les expose en général sous le préfixe global
 * de l’API (`/api/v1/proofs/...`), pas à la racine du host (`/proofs/...` → 404).
 */
function shouldPrefixWithApiBase(path: string): boolean {
  const p = path.startsWith('/') ? path : `/${path}`;
  return (
    p.startsWith('/proofs/') ||
    p.startsWith('/files/') ||
    p.startsWith('/attachments/')
  );
}

/**
 * Transforme une URL de fichier renvoyée par l’API (souvent chemin relatif au serveur Nest)
 * en URL absolue utilisable dans `<img src>` depuis le navigateur.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (url == null) return null;
  const s = String(url).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      const pathname = u.pathname;
      if (
        (pathname.startsWith('/proofs/') ||
          pathname.startsWith('/files/') ||
          pathname.startsWith('/attachments/')) &&
        !pathname.includes('/api/')
      ) {
        const apiBase = getApiBaseUrl();
        return `${apiBase}${pathname}${u.search}${u.hash}`;
      }
    } catch {
      /* ignore */
    }
    return s;
  }
  if (s.startsWith('//')) return `${typeof window !== 'undefined' ? window.location.protocol : 'https:'}${s}`;

  const apiBase = getApiBaseUrl();
  const path = s.startsWith('/') ? s : `/${s}`;

  if (shouldPrefixWithApiBase(s)) {
    return `${apiBase}${path}`;
  }

  const origin = apiBase.replace(/\/api\/v1\/?$/i, '');
  if (s.startsWith('/')) return `${origin}${s}`;
  return `${origin}/${s}`;
}
