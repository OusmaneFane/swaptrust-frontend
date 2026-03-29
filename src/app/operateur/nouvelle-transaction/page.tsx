import { redirect } from 'next/navigation';

/** L’ancien matching manuel n’existe plus — les demandes sont prises en charge depuis l’accueil opérateur. */
export default function NouvelleTransactionRedirectPage() {
  redirect('/operateur');
}
