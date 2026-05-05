'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm, type UseFormRegister, type UseFormWatch, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/exchange/StepIndicator';
import {
  PhoneInputSection,
  type PhoneFormFields,
} from '@/components/auth/PhoneInputSection';
import { registerPayloadPhones, universalPhonePayload } from '@/lib/phone-api-format';
import { PHONE_SEND_DIAL_OPTIONS } from '@/constants/phone-send-dial';
import { register as registerUser } from '@/services/authService';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nom requis'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    acceptTerms: z
      .boolean()
      .refine((v) => v === true, { message: 'Vous devez accepter les CGU' }),
    phoneMali: z
      .string()
      .transform((s) => s.replace(/\D/g, ''))
      .refine((s) => s === '' || s.length === 8, {
        message: 'Saisissez 8 chiffres pour le Mali',
      }),
    phoneRussia: z
      .string()
      .transform((s) => s.replace(/\D/g, ''))
      .refine((s) => s === '' || s.length === 10, {
        message: 'Saisissez 10 chiffres pour la Russie',
      }),
    whatsappDial: z
      .string()
      .transform((s) => s.replace(/\D/g, ''))
      .refine((s) => s === '' || /^\d{1,4}$/.test(s), {
        message: 'Indicatif invalide',
      }),
    whatsappNational: z.string().transform((s) => s.replace(/\D/g, '')),
    countryResidence: z.enum(['MALI', 'RUSSIA', 'OTHER']),
  })
  .superRefine((data, ctx) => {
    const isSenegalOptional =
      data.countryResidence === 'OTHER' && data.whatsappDial === '221';
    const hasAny = Boolean(
      data.phoneMali || data.phoneRussia || data.whatsappNational,
    );
    if (!hasAny) {
      if (isSenegalOptional) return;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Au moins un numéro de téléphone est requis pour recevoir les notifications WhatsApp',
        path: ['phoneMali'],
      });
      return;
    }

    if (data.countryResidence === 'OTHER') {
      if (isSenegalOptional && !data.whatsappNational) return;
      const full = `${data.whatsappDial ?? ''}${data.whatsappNational ?? ''}`;
      if (!/^\d{7,15}$/.test(full)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Saisissez un numéro valide (indicatif + national, 7 à 15 chiffres au total)',
          path: ['whatsappNational'],
        });
      }
    }
  });

type FormValues = z.infer<typeof registerSchema>;

const steps = ['Infos', 'Téléphones', 'Mot de passe', 'Confirmation'];

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      countryResidence: 'MALI',
      phoneMali: '',
      phoneRussia: '',
      whatsappDial: PHONE_SEND_DIAL_OPTIONS[0]?.dial ?? '223',
      whatsappNational: '',
      acceptTerms: false,
    },
  });

  async function nextStep() {
    const fields: Record<number, (keyof FormValues)[]> = {
      1: ['name', 'email', 'countryResidence'],
      2: ['phoneMali', 'phoneRussia', 'whatsappDial', 'whatsappNational'],
      3: ['password', 'acceptTerms'],
      4: [],
    };
    const ok = await trigger(fields[step] ?? [], { shouldFocus: true });
    if (ok) setStep((s) => Math.min(4, s + 1));
  }

  async function onSubmit(values: FormValues) {
    try {
      const phones = registerPayloadPhones({
        phoneMaliDigits: values.phoneMali,
        phoneRussiaDigits: values.phoneRussia,
      });

      const pick = () => {
        const otherOk =
          values.countryResidence === 'OTHER' &&
          values.whatsappDial?.trim() &&
          values.whatsappNational?.trim();
        if (otherOk) {
          const opt = PHONE_SEND_DIAL_OPTIONS.find(
            (o) => o.dial === values.whatsappDial,
          );
          return universalPhonePayload({
            phoneRaw: values.whatsappNational,
            countryCallingCodeDigits: values.whatsappDial,
            countryIso2: opt?.iso2,
          });
        }
        if (values.phoneMali?.trim()) {
          return universalPhonePayload({
            phoneRaw: values.phoneMali,
            countryCallingCodeDigits: '223',
            countryIso2: 'ML',
          });
        }
        if (values.phoneRussia?.trim()) {
          return universalPhonePayload({
            phoneRaw: values.phoneRussia,
            countryCallingCodeDigits: '7',
            countryIso2: 'RU',
          });
        }
        return {};
      };

      const universal = pick();
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        ...universal,
        ...phones,
        countryResidence: values.countryResidence,
      });
      toast.success('Compte créé');
      const signed = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (signed?.ok) {
        router.push('/tableau-de-bord');
        router.refresh();
      } else {
        router.push('/connexion');
      }
    } catch (err: unknown) {
      const ax = axios.isAxiosError(err);
      const status = ax ? err.response?.status : undefined;
      const msg =
        ax && typeof err.response?.data === 'object' && err.response?.data !== null
          ? (err.response?.data as Record<string, unknown>).message
          : undefined;

      if (status === 409 && typeof msg === 'string') {
        if (msg.includes('Email already in use')) {
          toast.error('Email déjà utilisé');
          return;
        }
        if (msg.includes('Phone number already in use')) {
          toast.error('Numéro déjà utilisé');
          return;
        }
      }
      toast.error('Inscription impossible — vérifiez vos informations');
    }
  }

  return (
    <Card className="p-8">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold text-text-dark">
          Créer votre compte
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Rejoignez DoniSend gratuitement
        </p>
      </div>
      <h1 className="font-display text-2xl font-bold">Inscription</h1>

      <div className="mt-6">
        <StepIndicator step={step} total={4} labels={steps} />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {step === 1 ? (
          <>
            <Input
              label="Nom complet"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <div>
              <label className="mb-2 block text-sm text-ink-secondary">
                Pays de résidence
              </label>
              <select className="input-field" {...register("countryResidence")}>
                <option value="MALI">Mali</option>
                <option value="RUSSIA">Russie</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
          </>
        ) : null}
        {step === 2 ? (
          <PhoneInputSection
            register={register as unknown as UseFormRegister<PhoneFormFields>}
            errors={errors as FieldErrors<PhoneFormFields>}
            watch={watch as unknown as UseFormWatch<PhoneFormFields>}
          />
        ) : null}
        {step === 3 ? (
          <>
            <Input
              label="Mot de passe"
              type="password"
              error={errors.password?.message}
              {...register("password")}
            />
            <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-4 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-primary"
                {...register('acceptTerms')}
              />
              <span className="text-ink-secondary">
                J’accepte les{' '}
                <Link href="/terms" className="font-semibold text-accent hover:underline">
                  Conditions d’utilisation (CGU)
                </Link>
                .
                {errors.acceptTerms?.message ? (
                  <span className="mt-1 block font-semibold text-danger">
                    {errors.acceptTerms.message}
                  </span>
                ) : null}
              </span>
            </label>
          </>
        ) : null}
        {step === 4 ? (
          <div className="space-y-3 text-sm text-ink-secondary">
            <p>
              <span className="text-ink-faint">Nom :</span> {watch("name")}
            </p>
            <p>
              <span className="text-ink-faint">Email :</span> {watch("email")}
            </p>
            <p>
              <span className="text-ink-faint">Pays :</span>{" "}
              {watch("countryResidence")}
            </p>
            {watch('countryResidence') !== 'OTHER' ? (
              <>
                <p>
                  <span className="text-ink-faint">WhatsApp Mali :</span>{' '}
                  {watch("phoneMali")
                    ? `+223 ${watch("phoneMali")
                        .replace(/(\d{2})(?=\d)/g, "$1 ")
                        .trim()}`
                    : "—"}
                </p>
                <p>
                  <span className="text-ink-faint">WhatsApp Russie :</span>{' '}
                  {watch("phoneRussia")
                    ? `+7 ${watch("phoneRussia")
                        .replace(/(\d{3})(?=\d)/g, "$1 ")
                        .trim()}`
                    : "—"}
                </p>
              </>
            ) : null}
            <p>
              <span className="text-ink-faint">WhatsApp Autre :</span>{' '}
              {watch('countryResidence') === 'OTHER' && watch('whatsappNational') ? (
                <>
                  +{watch('whatsappDial')}{' '}
                  {watch('whatsappNational')
                    .replace(/(\d{3})(?=\d)/g, '$1 ')
                    .trim()}
                </>
              ) : (
                '—'
              )}
            </p>
          </div>
        ) : null}

        <div className="flex gap-3 pt-2">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
            >
              Retour
            </Button>
          ) : null}
          {step < 4 ? (
            <Button
              type="button"
              className="flex-1"
              onClick={() => void nextStep()}
            >
              Continuer
            </Button>
          ) : (
            <Button type="submit" className="flex-1" loading={isSubmitting}>
              Créer mon compte
            </Button>
          )}
        </div>
        <p className="mt-2 text-sm text-ink-muted">
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="text-accent hover:underline">
            Connexion
          </Link>
        </p>
      </form>
    </Card>
  );
}
