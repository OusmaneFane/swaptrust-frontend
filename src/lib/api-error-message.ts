import axios from 'axios';

/**
 * Extrait un message lisible (corps Nest, erreur réseau, timeout).
 */
export function getApiErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;

  if (error.code === 'ECONNABORTED') {
    return 'Délai dépassé — l’API ne répond pas (timeout).';
  }

  if (!error.response) {
    const isNetwork =
      error.message === 'Network Error' ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED';
    if (isNetwork) {
      return 'Impossible de joindre l’API (réseau ou CORS). En local, retirez NEXT_PUBLIC_API_URL du .env pour utiliser le proxy /api/backend, ou ouvrez CORS sur le backend.';
    }
    return 'Aucune réponse du serveur — vérifiez l’URL de l’API et que Nest est démarré.';
  }

  const data = error.response.data;
  if (data === null || typeof data !== 'object') return null;
  const msg = (data as { message?: unknown }).message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  if (Array.isArray(msg)) {
    const parts = msg.filter((x): x is string => typeof x === 'string');
    if (parts.length) return parts.join(' ');
  }
  return null;
}
