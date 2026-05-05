"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";
import {
  flagCdnUrl,
  PHONE_SEND_DIAL_OPTIONS,
} from "@/constants/phone-send-dial";
import { combineDialAndNationalAny } from "@/lib/phone-api-format";

const WHATSAPP_ICON_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

export interface PhoneFormFields {
  phoneMali: string;
  phoneRussia: string;
  whatsappDial: string;
  whatsappNational: string;
  countryResidence: "MALI" | "RUSSIA" | "OTHER";
}

interface PhoneInputProps {
  register: UseFormRegister<PhoneFormFields>;
  errors: FieldErrors<PhoneFormFields>;
  watch: UseFormWatch<PhoneFormFields>;
}

export function PhoneInputSection({
  register,
  errors,
  watch,
}: PhoneInputProps) {
  const country = watch("countryResidence");
  const dial = watch("whatsappDial");
  const dialOption = PHONE_SEND_DIAL_OPTIONS.find((o) => o.dial === dial);
  const otherPlaceholder =
    PHONE_SEND_DIAL_OPTIONS.find((o) => o.dial === dial)?.placeholder ?? "";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-input border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
        <svg
          viewBox="0 0 24 24"
          className="mt-0.5 h-5 w-5 shrink-0"
          fill="#25D366"
          aria-hidden
        >
          <path d={WHATSAPP_ICON_PATH} />
        </svg>
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            Notifications WhatsApp
          </p>
          <p className="mt-0.5 text-xs text-ink-secondary">
            Vous serez notifié à chaque étape de vos échanges directement sur
            WhatsApp. Aucune application supplémentaire nécessaire.
          </p>
        </div>
      </div>

      {country !== "OTHER" ? (
        <>
          <div>
            <label className="mb-1 block text-sm text-ink-secondary">
              Numéro WhatsApp Mali
              {country === "MALI" ? (
                <span className="ml-1 text-xs text-primary">recommandé</span>
              ) : null}
            </label>
            <div className="flex gap-2">
              <span className="input-field flex w-20 shrink-0 items-center justify-center text-center text-sm text-ink-muted">
                +223
              </span>
              <input
                {...register("phoneMali")}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="70 12 34 56"
                className="input-field min-w-0 flex-1"
              />
            </div>
            {errors.phoneMali ? (
              <p className="mt-1 text-xs text-danger">
                {errors.phoneMali.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm text-ink-secondary">
              Numéro WhatsApp Russie
              {country === "RUSSIA" ? (
                <span className="ml-1 text-xs text-primary">recommandé</span>
              ) : null}
            </label>
            <div className="flex gap-2">
              <span className="input-field flex w-20 shrink-0 items-center justify-center text-center text-sm text-ink-muted">
                +7
              </span>
              <input
                {...register("phoneRussia")}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="9161234567"
                className="input-field min-w-0 flex-1"
              />
            </div>
            {errors.phoneRussia ? (
              <p className="mt-1 text-xs text-danger">
                {errors.phoneRussia.message}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {country === "OTHER" ? (
        <div>
          <label className="mb-1 block text-sm text-ink-secondary">
            Numéro WhatsApp (autre pays)
            <span className="ml-1 text-xs text-primary">recommandé</span>
          </label>
          <div className="flex gap-2">
            <div className="flex w-56 shrink-0 items-center gap-2 rounded-xl bg-bg-surface px-4 py-3">
              {dialOption?.iso2 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={flagCdnUrl(dialOption.iso2)}
                  alt=""
                  className="h-4 w-6 rounded-sm object-cover ring-1 ring-black/5"
                />
              ) : null}
              <select
                className="min-w-0 flex-1 truncate bg-transparent pr-2 text-sm outline-none"
                aria-label="Indicatif pays"
                {...register("whatsappDial")}
              >
                {PHONE_SEND_DIAL_OPTIONS.map((o) => (
                  <option key={`${o.iso2}-${o.dial}`} value={o.dial}>
                    {o.label} (+{o.dialDisplay})
                  </option>
                ))}
              </select>
            </div>
            <input
              {...register("whatsappNational")}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder={otherPlaceholder || "Numéro national"}
              className="input-field min-w-0 flex-1"
            />
          </div>
          {errors.whatsappNational ? (
            <p className="mt-1 text-xs text-danger">
              {errors.whatsappNational.message}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-ink-faint">
            En chiffres uniquement, sans « + » (ex.{" "}
            <span className="font-mono tabular-nums">
              {combineDialAndNationalAny(dial || "223", "70123456") ??
                "22370123456"}
            </span>
            ).
          </p>
        </div>
      ) : null}

      <p className="text-xs text-ink-faint">
        Au moins un numéro est requis.
        {country === "OTHER"
          ? " Choisissez votre pays et saisissez votre numéro national."
          : " Les deux sont recommandés si vous êtes entre les deux pays."}
      </p>
    </div>
  );
}
