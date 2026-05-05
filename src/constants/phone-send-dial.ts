export const PHONE_SEND_DIAL_OPTIONS: readonly {
  dial: string;
  /** Code ISO 3166-1 alpha-2 pour les drapeaux (flagcdn). */
  iso2: string;
  label: string;
  /** Libellé indicatif affiché (sans + côté API). */
  dialDisplay: string;
  placeholder: string;
}[] = [
  {
    dial: "223",
    iso2: "ml",
    label: "Mali",
    dialDisplay: "223",
    placeholder: "70123456",
  },
  {
    dial: "221",
    iso2: "sn",
    label: "Sénégal",
    dialDisplay: "221",
    placeholder: "701234567",
  },
  {
    dial: "225",
    iso2: "ci",
    label: "Côte d’Ivoire",
    dialDisplay: "225",
    placeholder: "0102030405",
  },
  {
    dial: "226",
    iso2: "bf",
    label: "Burkina Faso",
    dialDisplay: "226",
    placeholder: "70123456",
  },
  {
    dial: "227",
    iso2: "ne",
    label: "Niger",
    dialDisplay: "227",
    placeholder: "90123456",
  },
  {
    dial: "224",
    iso2: "gn",
    label: "Guinée",
    dialDisplay: "224",
    placeholder: "621234567",
  },
  {
    dial: "228",
    iso2: "tg",
    label: "Togo",
    dialDisplay: "228",
    placeholder: "90123456",
  },
  {
    dial: "229",
    iso2: "bj",
    label: "Bénin",
    dialDisplay: "229",
    placeholder: "90123456",
  },
  {
    dial: "237",
    iso2: "cm",
    label: "Cameroun",
    dialDisplay: "237",
    placeholder: "671234567",
  },
  {
    dial: "234",
    iso2: "ng",
    label: "Nigeria",
    dialDisplay: "234",
    placeholder: "8012345678",
  },
  {
    dial: "7",
    iso2: "ru",
    label: "Russie",
    dialDisplay: "7",
    placeholder: "9161234567",
  },
  {
    dial: "33",
    iso2: "fr",
    label: "France",
    dialDisplay: "33",
    placeholder: "612345678",
  },
  {
    dial: "1",
    iso2: "us",
    label: "États‑Unis",
    dialDisplay: "1",
    placeholder: "2025550123",
  },
];

export function flagCdnUrl(iso2: string, width = 80): string {
  return `https://flagcdn.com/w${width}/${iso2}.png`;
}
