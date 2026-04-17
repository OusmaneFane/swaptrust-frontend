import type { PhoneSendDial } from '@/lib/phone-api-format';

export const PHONE_SEND_DIAL_OPTIONS: readonly {
  dial: PhoneSendDial;
  /** Code ISO 3166-1 alpha-2 pour les drapeaux (flagcdn). */
  iso2: string;
  label: string;
  /** Libellé indicatif affiché (sans + côté API). */
  dialDisplay: string;
  placeholder: string;
}[] = [
  {
    dial: '223',
    iso2: 'ml',
    label: 'Mali',
    dialDisplay: '223',
    placeholder: '70123456',
  },
  {
    dial: '7',
    iso2: 'ru',
    label: 'Russie',
    dialDisplay: '7',
    placeholder: '9161234567',
  },
];

export function flagCdnUrl(iso2: string, width = 80): string {
  return `https://flagcdn.com/w${width}/${iso2}.png`;
}
