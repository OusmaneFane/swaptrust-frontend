import { getApiBaseUrl } from '@/lib/api-base';
import type { User } from '@/types/user';

/** Champs utiles après login quand la réponse ne contient que les jetons. */
export type AuthMeLoginFields = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

/**
 * Profil courant (GET /auth/me) — même source que le client après connexion.
 */
export async function fetchAuthMeProfile(
  accessToken: string,
): Promise<AuthMeLoginFields | null> {
  try {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    const inner =
      typeof json.data === 'object' && json.data !== null
        ? (json.data as Record<string, unknown>)
        : json;
    const idRaw = inner.id ?? inner.userId ?? inner.sub;
    if (idRaw == null || String(idRaw).trim() === '') return null;
    const email = typeof inner.email === 'string' ? inner.email : '';
    const name =
      typeof inner.name === 'string'
        ? inner.name
        : typeof inner.fullName === 'string'
          ? inner.fullName
          : email || String(idRaw);
    const isAdmin =
      inner.isAdmin === true ||
      inner.role === 'ADMIN' ||
      inner.role === 'admin';
    return {
      id: String(idRaw).trim(),
      email,
      name,
      isAdmin: Boolean(isAdmin),
    };
  } catch {
    return null;
  }
}

/**
 * Lecture serveur du profil (JWT / callbacks NextAuth) — évite axios & session client.
 */
export async function fetchAuthMeKycStatus(
  accessToken: string,
): Promise<User['kycStatus'] | undefined> {
  try {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return undefined;
    const json = (await res.json()) as {
      data?: { kycStatus?: string };
      kycStatus?: string;
    };
    const k = json?.data?.kycStatus ?? json?.kycStatus;
    if (
      k === 'NOT_SUBMITTED' ||
      k === 'PENDING' ||
      k === 'VERIFIED' ||
      k === 'REJECTED'
    ) {
      return k;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
