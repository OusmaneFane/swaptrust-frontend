import type { PaymentMethod } from "@/types/order";
import type { RequestType } from "@/types/request";

/** Envoi en francs CFA — Orange, Moov, Wave. */
export const PAYMENT_METHODS_FOR_SEND_CFA = [
  "ORANGE_MONEY",
] as const satisfies readonly PaymentMethod[];

/** Envoi en roubles (₽) — SBP, BTB, T-Bank. */
export const PAYMENT_METHODS_FOR_SEND_RUB = [
  "SBP",
] as const satisfies readonly PaymentMethod[];

/** Méthodes avec logo (utilisées dans le grid). */
export const FORM_GRID_PAYMENT_METHODS = [
  "ORANGE_MONEY",
  "MOOV_MONEY",
  "WAVE",
  "SBP",
  "BTB",
  "T-BANK",
] as const satisfies readonly PaymentMethod[];

/** Toutes les valeurs possibles du formulaire « nouvelle demande ». */
export const ALL_FORM_PAYMENT_METHODS = FORM_GRID_PAYMENT_METHODS;

export type FormGridPaymentMethod = (typeof FORM_GRID_PAYMENT_METHODS)[number];

export function isFormGridPaymentMethod(
  method: PaymentMethod,
): method is FormGridPaymentMethod {
  return (ALL_FORM_PAYMENT_METHODS as readonly string[]).includes(method);
}

/** Ordre d’affichage global (liste complète). */
export const PAYMENT_METHOD_CHOICE_ORDER = ALL_FORM_PAYMENT_METHODS;

export function paymentMethodsForRequestType(
  type: RequestType,
): readonly FormGridPaymentMethod[] {
  /**
   * `type` exprime ce que le client veut recevoir.
   * Le moyen d’envoi doit donc être l’inverse :
   * - NEED_RUB → le client envoie XOF (CFA)
   * - NEED_CFA → le client envoie RUB
   */
  return type === "NEED_RUB"
    ? PAYMENT_METHODS_FOR_SEND_CFA
    : PAYMENT_METHODS_FOR_SEND_RUB;
}

export function defaultPaymentMethodForRequestType(
  type: RequestType,
): FormGridPaymentMethod {
  return paymentMethodsForRequestType(type)[0]!;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ORANGE_MONEY: "Orange Money",
  MOOV_MONEY: "Moov Money",
  WAVE: "Wave",
  BANK_TRANSFER: "Virement bancaire",
  SBP: "SBP",
  BTB: "BTB",
  "T-BANK": "T-Bank",
  OTHER: "Autre",
};

/**
 * Logos officiels (PNG ou WebP recommandés), à placer dans `public/payments/`.
 * Remplacez par les visuels fournis par chaque marque (charte / partenariat).
 */
export const PAYMENT_METHOD_BRAND_IMAGE: Record<FormGridPaymentMethod, string> =
  {
    ORANGE_MONEY: "/payments/orange-money.png",
    MOOV_MONEY: "/payments/moov-money.webp",
    WAVE: "/payments/wave.png",
    SBP: "/payments/sbp.png",
    BTB: "/payments/btb.png",
    "T-BANK": "/payments/tbank.jpg",
  };

/** Logo `/public/payments/…` si la méthode en a un, sinon `null`. */
export function paymentBrandImageSrcForMethod(
  method: PaymentMethod,
): string | null {
  return isFormGridPaymentMethod(method)
    ? PAYMENT_METHOD_BRAND_IMAGE[method]
    : null;
}
