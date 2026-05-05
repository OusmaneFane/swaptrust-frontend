import type { RequestType } from '@/types/request';

/**
 * Contrat API : indicatif pays + numéro national, **chiffres uniquement**, **sans** `+`
 * (ex. `22382791234`, `79968414684`).
 */

function digitsOnly(input: string): string {
  const t = input.trim().replace(/\s/g, '');
  const core = t.startsWith('+') ? t.slice(1) : t;
  return core.replace(/\D/g, '');
}

/** Inscription : champs nationaux (8 / 10 chiffres). */
export function registerPayloadPhones(args: {
  phoneMaliDigits: string;
  phoneRussiaDigits: string;
}): { phoneMali?: string; phoneRussia?: string } {
  const mali = digitsOnly(args.phoneMaliDigits);
  const rus = digitsOnly(args.phoneRussiaDigits);
  return {
    ...(mali.length === 8 ? { phoneMali: `223${mali}` } : {}),
    ...(rus.length === 10 ? { phoneRussia: `7${rus}` } : {}),
  };
}

function isE164(raw: string): boolean {
  const t = raw.trim();
  return /^\+\d{7,15}$/.test(t);
}

/**
 * Payload universel (multi-pays) :
 * - `phone` peut être en national (chiffres) ou déjà en E.164 (`+...`)
 * - `countryCallingCode` requis si `phone` n'est pas en E.164
 */
export function universalPhonePayload(args: {
  phoneRaw?: string;
  countryCallingCodeDigits?: string;
  countryIso2?: string;
}): { phone?: string; countryCallingCode?: string; countryIso2?: string } {
  const phone = (args.phoneRaw ?? '').trim();
  const calling = (args.countryCallingCodeDigits ?? '').replace(/\D/g, '');
  const iso2 = (args.countryIso2 ?? '').trim().toUpperCase();

  if (!phone) return {};
  if (isE164(phone)) {
    return {
      phone,
      ...(iso2 ? { countryIso2: iso2 } : {}),
    };
  }
  const digits = phone.replace(/\D/g, '');
  if (!digits) return {};
  return {
    phone: digits,
    ...(calling ? { countryCallingCode: calling } : {}),
    ...(iso2 ? { countryIso2: iso2 } : {}),
  };
}

/** Champ Mali profil : `223` + 8 chiffres, ou saisie nationale 8 chiffres, ou `+223…`. */
export function profileMaliToApi(raw: string): string | null {
  const d = digitsOnly(raw);
  if (/^223\d{8}$/.test(d)) return d;
  if (/^\d{8}$/.test(d)) return `223${d}`;
  return null;
}

/** Champ Russie profil : `7` + 10 chiffres, ou 10 chiffres nationaux, ou `+7…`. */
export function profileRussiaToApi(raw: string): string | null {
  const d = digitsOnly(raw);
  if (/^7\d{10}$/.test(d)) return d;
  if (/^\d{10}$/.test(d)) return `7${d}`;
  return null;
}

/**
 * Champ unique (ex. OTP WhatsApp) : accepte Mali ou Russie, avec ou sans `+`,
 * ou forme nationale (8 / 10 chiffres).
 */
export function flexiblePhoneToApi(raw: string): string | null {
  const d = digitsOnly(raw);
  if (/^223\d{8}$/.test(d)) return d;
  if (/^7\d{10}$/.test(d)) return d;
  if (/^\d{8}$/.test(d)) return `223${d}`;
  if (/^\d{10}$/.test(d)) return `7${d}`;
  return null;
}

export type PhoneSendDial = '223' | '7';

/**
 * Indicatif (`223` ou `7`) + numéro national (chiffres uniquement), **sans** `+`.
 * Ex. `223` + `70123456` → `22370123456`.
 */
export function combineDialAndNational(
  dial: PhoneSendDial,
  nationalRaw: string,
): string | null {
  const nat = nationalRaw.replace(/\D/g, '');
  if (dial === '223' && /^\d{8}$/.test(nat)) return `223${nat}`;
  if (dial === '7' && /^\d{10}$/.test(nat)) return `7${nat}`;
  return null;
}

/**
 * Indicatif (1-4 chiffres) + numéro national (chiffres uniquement), **sans** `+`.
 * Validation légère E.164: longueur totale 7..15 chiffres.
 */
export function combineDialAndNationalAny(
  dialRaw: string,
  nationalRaw: string,
): string | null {
  const dial = dialRaw.replace(/\D/g, '');
  const nat = nationalRaw.replace(/\D/g, '');
  if (!/^\d{1,4}$/.test(dial)) return null;
  if (!/^\d{4,14}$/.test(nat)) return null;
  const full = `${dial}${nat}`;
  if (!/^\d{7,15}$/.test(full)) return null;
  return full;
}

/** Francs CFA → numéro malien ; roubles (₽) → numéro russe. */
export function phoneDialForRequestType(type: RequestType): PhoneSendDial {
  return type === 'NEED_CFA' ? '223' : '7';
}
