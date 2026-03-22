/** Valeurs envoyées à POST /kyc/submit (docType). Ajuster si votre API utilise d’autres codes. */
export const KYC_DOC_TYPE_OPTIONS = [
  { value: 'NATIONAL_ID', label: 'Carte nationale d’identité (CNI)' },
  { value: 'PASSPORT', label: 'Passeport' },
  { value: 'RESIDENCE_PERMIT', label: 'Titre de séjour' },
  { value: 'DRIVERS_LICENSE', label: 'Permis de conduire' },
] as const;

export type KycDocTypeValue = (typeof KYC_DOC_TYPE_OPTIONS)[number]['value'];
