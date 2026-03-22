import axios from 'axios';
import type { ApiResponse } from '@/types';
import { fetchAuthMeProfile } from '@/lib/auth-me-server';
import api from '@/services/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phoneMali?: string;
  phoneRussia?: string;
  countryResidence: 'MALI' | 'RUSSIA' | 'OTHER';
}

/** Utilisateur minimal après login (id souvent UUID côté Nest). */
export interface LoggedInUser {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  user: LoggedInUser;
}

/** Déduit le statut admin depuis un objet user ou les claims JWT. */
function deriveIsAdmin(obj: Record<string, unknown>): boolean {
  if (obj.isAdmin === true) return true;
  const role = obj.role;
  if (role === 'ADMIN' || role === 'admin') return true;
  if (Array.isArray(obj.roles)) {
    for (const r of obj.roles) {
      if (typeof r !== 'string') continue;
      const u = r.toUpperCase();
      if (u === 'ADMIN' || u === 'ROLE_ADMIN' || u.endsWith('_ADMIN')) return true;
    }
  }
  const realm = obj.realm_access;
  if (
    typeof realm === 'object' &&
    realm !== null &&
    Array.isArray((realm as Record<string, unknown>).roles)
  ) {
    for (const r of (realm as Record<string, unknown>).roles as unknown[]) {
      if (typeof r === 'string' && r.toUpperCase().includes('ADMIN')) return true;
    }
  }
  return false;
}

function getAuthLoginPath(): string {
  const p =
    process.env.AUTH_LOGIN_PATH ??
    process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH ??
    'auth/login';
  return p.replace(/^\/+/, '').replace(/\/+$/, '');
}

function decodeUserFromJwt(accessToken: string): LoggedInUser | undefined {
  try {
    const parts = accessToken.split('.');
    if (parts.length < 2 || !parts[1]) return undefined;
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(
      Buffer.from(padded, 'base64').toString('utf8'),
    ) as Record<string, unknown>;
    const sub = json.sub ?? json.userId ?? json.id;
    if (sub == null) return undefined;
    const email = typeof json.email === 'string' ? json.email : '';
    const name =
      typeof json.name === 'string'
        ? json.name
        : typeof json.username === 'string'
          ? json.username
          : email || String(sub);
    return {
      id: String(sub),
      email,
      name,
      isAdmin: deriveIsAdmin(json),
    };
  } catch {
    return undefined;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function pickToken(obj: Record<string, unknown>): string | undefined {
  const t =
    obj.accessToken ??
    obj.access_token ??
    obj.token ??
    (isRecord(obj.tokens) ? obj.tokens.accessToken ?? obj.tokens.access_token : undefined);
  return typeof t === 'string' ? t : undefined;
}

function pickUser(obj: Record<string, unknown>): LoggedInUser | undefined {
  let u: Record<string, unknown> | undefined;
  if (isRecord(obj.user)) u = obj.user;
  else if (isRecord(obj.profile)) u = obj.profile;
  else if (isRecord(obj.account)) u = obj.account;
  else if (
    obj.id !== undefined ||
    obj.userId !== undefined ||
    obj.sub !== undefined
  ) {
    u = obj;
  }
  if (!u) return undefined;
  const idRaw = u.id ?? u.userId ?? u.sub;
  if (idRaw === undefined || idRaw === null) return undefined;
  const idStr = String(idRaw).trim();
  if (!idStr) return undefined;
  const email = typeof u.email === 'string' ? u.email : '';
  const name =
    typeof u.name === 'string'
      ? u.name
      : typeof u.fullName === 'string'
        ? u.fullName
        : email || idStr;
  return { id: idStr, email, name, isAdmin: deriveIsAdmin(u) };
}

/** Extrait token + user depuis plusieurs formes de réponses Nest / enveloppes ApiResponse. */
function parseLoginResponse(
  body: unknown,
  fallbackEmail: string,
): AuthTokens | null {
  if (!isRecord(body)) return null;

  const candidates: Record<string, unknown>[] = [body];
  if (isRecord(body.data)) candidates.push(body.data);
  if (isRecord(body.payload)) candidates.push(body.payload);
  if (isRecord(body.result)) candidates.push(body.result);

  let accessToken: string | undefined;
  let user: LoggedInUser | undefined;

  for (const c of candidates) {
    const t = pickToken(c);
    const u = pickUser(c);
    if (t) accessToken = t;
    if (u) user = u;
    if (accessToken && user) break;
  }

  if (!accessToken) {
    for (const c of candidates) {
      accessToken = pickToken(c);
      if (accessToken) break;
    }
  }
  if (!user) {
    for (const c of candidates) {
      user = pickUser(c);
      if (user) break;
    }
  }

  if (!accessToken) return null;

  if (!user) {
    user = decodeUserFromJwt(accessToken);
  }
  if (!user && fallbackEmail) {
    user = {
      id: fallbackEmail,
      email: fallbackEmail,
      name: fallbackEmail,
    };
  }

  if (!user?.id) return null;

  return { accessToken, user };
}

function buildLoginBody(payload: LoginPayload): Record<string, string> {
  if (process.env.AUTH_LOGIN_USERNAME_FIELD === 'username') {
    return { username: payload.email, password: payload.password };
  }
  return { email: payload.email, password: payload.password };
}

/** Pour debug dev : affiche la réponse login sans exposer les jetons dans la console. */
function redactForDevLog(value: unknown, depth = 0): unknown {
  if (depth > 10) return '[…]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const jwtLike = value.split('.').length === 3 && value.length > 40;
    if (jwtLike) return '[JWT redacted]';
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactForDevLog(v, depth + 1));
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      const kl = k.toLowerCase();
      if (
        kl.includes('token') ||
        kl.includes('password') ||
        kl === 'authorization'
      ) {
        out[k] = typeof v === 'string' ? '[redacted]' : redactForDevLog(v, depth + 1);
      } else {
        out[k] = redactForDevLog(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

export async function login(
  payload: LoginPayload,
): Promise<AuthTokens | null> {
  const path = `/${getAuthLoginPath()}`;
  try {
    const { data } = await api.post<unknown>(path, buildLoginBody(payload));
    if (isRecord(data) && 'success' in data && data.success === false) {
      return null;
    }
    let parsed = parseLoginResponse(data, payload.email);
    if (!parsed && process.env.NODE_ENV === 'development') {
      const keys = isRecord(data) ? Object.keys(data) : [];
      const innerKeys =
        isRecord(data) && isRecord(data.data) ? Object.keys(data.data) : [];
      console.warn('[authService] login: réponse non reconnue', {
        path,
        keys,
        dataKeys: innerKeys,
      });
    }
    if (!parsed) return null;

    const me = await fetchAuthMeProfile(parsed.accessToken);
    if (me) {
      parsed = {
        accessToken: parsed.accessToken,
        user: {
          id: me.id,
          email: me.email || parsed.user.email || payload.email,
          name: me.name || parsed.user.name,
          isAdmin: me.isAdmin,
        },
      };
    } else if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[authService] GET /auth/me indisponible — isAdmin repose uniquement sur le JWT / pickUser',
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(
        '[authService] réponse API login (jetons masqués) →',
        redactForDevLog(data),
      );
      console.log(
        '[authService] utilisateur session (JWT puis enrichissement /auth/me) →',
        parsed.user,
        '| isAdmin:',
        parsed.user.isAdmin,
      );
    }
    return parsed;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      const ax = axios.isAxiosError(err);
      console.warn('[authService] POST login → backend', {
        path,
        error: ax
          ? {
              message: err.message,
              code: err.code,
              status: err.response?.status,
              data: err.response?.data,
            }
          : err,
      });
    }
    return null;
  }
}

export async function register(
  payload: RegisterPayload,
): Promise<ApiResponse<unknown>> {
  const { data } = await api.post<ApiResponse<unknown>>(
    '/auth/register',
    payload,
  );
  return data;
}
