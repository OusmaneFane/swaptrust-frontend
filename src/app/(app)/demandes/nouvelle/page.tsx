"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showWhatsappToast } from "@/components/ui/WhatsappToast";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  isNetXofOutsideTypicalRange,
  majorToMinor,
  MIN_REQUEST_AMOUNT_MINOR,
} from "@/lib/money-minor";
import {
  combineDialAndNational,
  phoneDialForRequestType,
} from "@/lib/phone-api-format";
import { parseDecimalLike } from "@/lib/parse-decimal-json";
import { userWhatsappNotifyPhone } from "@/lib/user-phones";
import { authApi, requestsApi, ratesApi } from "@/services/api";
import { CommissionBreakdown } from "@/components/client/CommissionBreakdown";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { cn, formatCFA, formatRUB } from "@/lib/utils";
import {
  ALL_FORM_PAYMENT_METHODS,
  defaultPaymentMethodForRequestType,
  PAYMENT_METHOD_LABELS,
  paymentMethodsForRequestType,
} from "@/constants/payment-methods";
import { PaymentMethodGrid } from "@/components/payment/PaymentMethodGrid";
import { PhoneDialNationalFields } from "@/components/client/PhoneDialNationalFields";
import type { RequestType, User } from "@/types";

const schema = z
  .object({
    type: z.enum(["NEED_RUB", "NEED_CFA"]),
    amountWantedMajor: z
      .string()
      .min(1, "Montant requis")
      .refine((s) => Number(s) > 0, "Montant trop faible")
      .refine(
        (s) => majorToMinor(Number(s)) >= MIN_REQUEST_AMOUNT_MINOR,
        "Minimum 1,00 affiché (100 centimes ou 100 kopecks côté API)",
      ),
    paymentMethod: z.enum([
      ALL_FORM_PAYMENT_METHODS[0],
      ALL_FORM_PAYMENT_METHODS[1],
      ALL_FORM_PAYMENT_METHODS[2],
      ALL_FORM_PAYMENT_METHODS[3],
      ALL_FORM_PAYMENT_METHODS[4],
      ALL_FORM_PAYMENT_METHODS[5],
    ]),
    phoneNational: z.string(),
    note: z.string().max(300).optional(),
  })
  .superRefine((data, ctx) => {
    const dial = phoneDialForRequestType(data.type);
    if (combineDialAndNational(dial, data.phoneNational) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          dial === "223"
            ? "8 chiffres pour le Mali (sans le 223)."
            : "10 chiffres pour la Russie (sans le 7).",
        path: ["phoneNational"],
      });
    }
    const allowed = paymentMethodsForRequestType(data.type);
    if (!(allowed as readonly string[]).includes(data.paymentMethod)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choisissez un moyen d’envoi adapté au type de demande.",
        path: ["paymentMethod"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function NouvelleDemandePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const { data: rateData } = useExchangeRate();

  const { data: publicSettings } = useQuery({
    queryKey: ["settings", "public", "request-form"],
    queryFn: async () => {
      // Lazy import to avoid widening imports at module init
      const { settingsApi } = await import("@/services/api");
      return settingsApi.public();
    },
    staleTime: 60_000,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "NEED_RUB",
      paymentMethod: defaultPaymentMethodForRequestType("NEED_RUB"),
      phoneNational: "",
    },
  });

  const { setValue, getValues } = form;
  const watchedType = form.watch("type");

  useEffect(() => {
    const allowed = paymentMethodsForRequestType(watchedType);
    const current = getValues("paymentMethod");
    if (!(allowed as readonly string[]).includes(current)) {
      setValue("paymentMethod", allowed[0]);
    }
    setValue("phoneNational", "");
  }, [watchedType, getValues, setValue]);
  const watchedAmount = Number(form.watch("amountWantedMajor") || 0);
  /** Centimes / kopecks — même unité que Swagger (`amount` sur /rates/calculate et amountWanted). */
  const amountMinor =
    watchedAmount > 0 && Number.isFinite(watchedAmount)
      ? majorToMinor(watchedAmount)
      : 0;

  const { data: calc } = useQuery({
    queryKey: ["rates", "calc", "request", amountMinor, watchedType],
    queryFn: () =>
      watchedType === "NEED_RUB"
        ? ratesApi.calculate(amountMinor, "RUB", "XOF")
        : ratesApi.calculate(amountMinor, "XOF", "RUB"),
    enabled: amountMinor >= MIN_REQUEST_AMOUNT_MINOR,
  });

  const { data: me } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
  });

  const mutation = useMutation({
    mutationFn: requestsApi.create,
    onSuccess: () => {
      toast.success("Demande publiée ! Un opérateur va vous contacter.");
      const fresh = qc.getQueryData<User>(["auth", "me"]) ?? me;
      const phone = userWhatsappNotifyPhone(fresh);
      if (phone) showWhatsappToast(phone);
      router.push("/tableau-de-bord");
    },
    onError: (err: unknown) => {
      const apiMsg = getApiErrorMessage(err);
      toast.error(apiMsg ?? "Publication impossible");
    },
  });

  async function onPublish() {
    const valid = await form.trigger();
    if (!valid) return;
    const v = form.getValues();
    const major = Number(v.amountWantedMajor);
    if (!Number.isFinite(major) || major <= 0) {
      toast.error("Montant invalide");
      return;
    }
    const amountWanted = majorToMinor(major);
    if (amountWanted < MIN_REQUEST_AMOUNT_MINOR) {
      toast.error("Montant trop faible (minimum 1 unité affichée).");
      return;
    }
    const phoneApi = combineDialAndNational(
      phoneDialForRequestType(v.type),
      v.phoneNational,
    );
    if (!phoneApi) {
      toast.error("Numéro invalide");
      return;
    }
    mutation.mutate({
      type: v.type as RequestType,
      amountWanted,
      paymentMethod: v.paymentMethod,
      phoneToSend: phoneApi,
      ...(v.note?.trim() ? { note: v.note.trim() } : {}),
    });
  }

  const resultMinor =
    calc && amountMinor >= MIN_REQUEST_AMOUNT_MINOR
      ? Math.round(parseDecimalLike(calc.result))
      : 0;
  const sendMinor = resultMinor;
  const commissionMinorFromApi =
    calc?.commissionAmount != null
      ? Math.round(parseDecimalLike(calc.commissionAmount))
      : null;
  const commissionPercent =
    calc?.commissionRate != null && Number.isFinite(Number(calc.commissionRate))
      ? Number(calc.commissionRate)
      : publicSettings?.commissionPercent ?? 0;
  /** Commission en unités mineures de la devise d’envoi (CFA si NEED_RUB, RUB si NEED_CFA). */
  const estimatedCommissionSendMinor =
    sendMinor > 0 ? Math.round((sendMinor * commissionPercent) / 100) : 0;
  const commissionInSendMinor =
    commissionMinorFromApi != null &&
    commissionMinorFromApi > 0 &&
    amountMinor > 0
      ? Math.round((commissionMinorFromApi * sendMinor) / amountMinor)
      : estimatedCommissionSendMinor;
  const totalSendMinor = sendMinor + commissionInSendMinor;
  const commissionDisplaySecondary =
    commissionMinorFromApi != null && commissionMinorFromApi > 0
      ? watchedType === "NEED_RUB"
        ? formatRUB(commissionMinorFromApi)
        : formatCFA(commissionMinorFromApi)
      : null;
  const commissionSecondaryLabel =
    commissionDisplaySecondary != null
      ? `Soit ${commissionDisplaySecondary} (réf. API).`
      : null;

  // Toujours prendre le taux venant de l’endpoint `/rates/current`.
  // On préfère `rateWithSpread` (taux effectif côté API) si fourni, sinon `rate` (brut).
  const googleRatePerCfa =
    rateData?.rateWithSpread != null && rateData.rateWithSpread > 0
      ? rateData.rateWithSpread
      : rateData?.rate != null && rateData.rate > 0
        ? rateData.rate
        : 0;

  const cfaNetWarning =
    watchedType === "NEED_RUB" &&
    resultMinor > 0 &&
    isNetXofOutsideTypicalRange(resultMinor);

  return (
    <div
      className={cn(
        "mx-auto min-w-0 space-y-6",
        step === 2 ? "max-w-lg lg:max-w-4xl" : "max-w-lg",
      )}
    >
      <h1 className="font-display text-2xl font-bold text-text-dark">
        Nouvelle demande
      </h1>

      {step === 1 ? (
        <Card className="space-y-5 p-5">
          <p className="text-sm font-medium text-slate-600">
            Étape 1 — Ce dont j’ai besoin
          </p>
          <p className="text-sm text-text-muted">J’ai besoin de :</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  id: "NEED_RUB" as const,
                  flag: "🇷🇺",
                  flagLabel: "Russie",
                  title: "Roubles (₽)",
                  sub: "Je paie en CFA",
                },
                {
                  id: "NEED_CFA" as const,
                  flag: "🇲🇱",
                  flagLabel: "Mali",
                  title: "Francs CFA",
                  sub: "Je paie en ₽",
                },
              ] as const
            ).map(({ id, flag, flagLabel, title, sub }) => (
              <button
                key={id}
                type="button"
                onClick={() => form.setValue("type", id)}
                className={cn(
                  "rounded-card border p-4 text-left transition-colors",
                  watchedType === id
                    ? "border-primary bg-primary/10"
                    : "border-primary/15 hover:border-primary/30",
                )}
              >
                <p className="flex items-center gap-2 font-semibold text-text-dark">
                  <span aria-label={flagLabel} title={flagLabel}>
                    {flag}
                  </span>
                  <span>{title}</span>
                </p>
                <p className="text-xs text-text-muted">{sub}</p>
              </button>
            ))}
          </div>
          <Input
            label={
              watchedType === "NEED_RUB"
                ? "Montant souhaité (₽, unités)"
                : "Montant souhaité (CFA, unités)"
            }
            type="number"
            step="0.01"
            error={form.formState.errors.amountWantedMajor?.message}
            {...form.register("amountWantedMajor")}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">
              Détail de votre échange (estimation)
            </p>
            {calc && amountMinor >= MIN_REQUEST_AMOUNT_MINOR ? (
              <CommissionBreakdown
                type={watchedType}
                googleRatePerCfa={googleRatePerCfa}
                percentChange24h={rateData?.percentChange ?? 0}
                trend={rateData?.trend ?? "stable"}
                fetchedAt={rateData?.fetchedAt ?? null}
                netSendMinor={sendMinor}
                commissionPercent={commissionPercent}
                commissionSendMinor={commissionInSendMinor}
                totalSendMinor={totalSendMinor}
                receiveMinor={amountMinor}
                commissionSecondaryLabel={commissionSecondaryLabel}
                compact
              />
            ) : (
              <p className="rounded-input border border-primary/10 bg-slate-50 p-3 text-xs text-text-muted">
                Saisissez un montant valide pour voir le détail (taux Google +
                commission séparée).
              </p>
            )}
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={async () => {
              const ok = await form.trigger("amountWantedMajor");
              if (ok && amountMinor >= MIN_REQUEST_AMOUNT_MINOR) setStep(2);
            }}
          >
            Continuer
          </Button>
        </Card>
      ) : null}

      {step === 2 ? (
        <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
          <Card className="min-w-0 space-y-4 p-4 sm:p-5">
            <p className="text-sm font-medium text-slate-600">
              Étape 2 — Comment j’envoie
            </p>
            <Controller
              control={form.control}
              name="paymentMethod"
              render={({ field, fieldState }) => (
                <PaymentMethodGrid
                  requestType={watchedType}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <p className="text-sm font-medium text-slate-600">
              Mon numéro pour recevoir les fonds
            </p>
            <PhoneDialNationalFields
              requestType={watchedType}
              nationalRegister={form.register("phoneNational")}
              nationalError={form.formState.errors.phoneNational?.message}
            />
            <Input
              label="Message optionnel pour l’opérateur"
              {...form.register("note")}
            />
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setStep(1)}
              >
                Retour
              </Button>
            </div>
          </Card>

          <Card className="min-w-0 space-y-4 border-primary/20 bg-gradient-to-br from-white to-primary/[0.05] p-4 text-sm sm:p-5">
            <p className="font-display font-semibold text-text-dark">
              Récapitulatif
            </p>
            {calc && amountMinor >= MIN_REQUEST_AMOUNT_MINOR ? (
              <CommissionBreakdown
                className="min-w-0"
                type={watchedType}
                googleRatePerCfa={googleRatePerCfa}
                percentChange24h={rateData?.percentChange ?? 0}
                trend={rateData?.trend ?? "stable"}
                fetchedAt={rateData?.fetchedAt ?? null}
                netSendMinor={sendMinor}
                commissionPercent={commissionPercent}
                commissionSendMinor={commissionInSendMinor}
                totalSendMinor={totalSendMinor}
                receiveMinor={amountMinor}
                commissionSecondaryLabel={commissionSecondaryLabel}
              />
            ) : null}
            <div className="flex flex-col gap-1 border-t border-primary/10 pt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <span className="shrink-0 text-text-muted">
                Sur quel numéro envoyer ?
              </span>
              <span className="min-w-0 break-words font-medium text-text-dark sm:text-right">
                {PAYMENT_METHOD_LABELS[form.watch("paymentMethod")]}
              </span>
            </div>
            <p className="rounded-input border border-primary/20 bg-primary/[0.04] p-3 text-xs text-slate-600">
              Après prise en charge, vous recevrez les instructions pour envoyer
              le <strong className="text-text-dark">montant total</strong> sur
              un{" "}
              <strong className="text-text-dark">
                numéro DoniSend officiel
              </strong>{" "}
              (jamais directement sur le portable de l’opérateur).
            </p>
            <p className="rounded-input border border-warning/30 bg-warning/10 p-3 text-xs text-slate-600">
              Le taux est verrouillé au moment de la publication. Un opérateur
              prendra en charge votre demande sous peu.
            </p>
            {cfaNetWarning ? (
              <p className="rounded-input border border-warning/25 bg-warning/5 p-3 text-xs text-slate-600">
                Le montant CFA estimé sort souvent des limites serveur (ordre de
                grandeur 5 000 – 500 000 F). En cas d’échec, le message renvoyé
                par l’API (ex. « Montant CFA hors limites ») s’affichera
                ci-dessus.
              </p>
            ) : null}
            <Button
              type="button"
              className="w-full"
              loading={mutation.isPending}
              onClick={() => void onPublish()}
            >
              Publier ma demande
            </Button>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
