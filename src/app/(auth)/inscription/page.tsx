'use client';

import { useState } from 'react';
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
import { registerPayloadPhones } from '@/lib/phone-api-format';
import { register as registerUser } from '@/services/authService';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nom requis'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Minimum 8 caractères'),
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
    countryResidence: z.enum(['MALI', 'RUSSIA', 'OTHER']),
  })
  .refine((data) => Boolean(data.phoneMali || data.phoneRussia), {
    message:
      'Au moins un numéro de téléphone est requis pour recevoir les notifications WhatsApp',
    path: ['phoneMali'],
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
    },
  });

  async function nextStep() {
    const fields: Record<number, (keyof FormValues)[]> = {
      1: ['name', 'email', 'countryResidence'],
      2: ['phoneMali', 'phoneRussia'],
      3: ['password'],
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
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
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
        router.push('/inscription/success');
        router.refresh();
      } else {
        router.push('/connexion');
      }
    } catch {
      toast.error('Inscription impossible — vérifiez l’API');
    }
  }

  return (
    <Card className="p-8">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-display font-semibold text-white">Créer votre compte</h2>
        <p className="mt-1 text-sm text-text-secondary">Rejoignez DoniSend gratuitement</p>
      </div>
      <h1 className="font-display text-2xl font-bold">Inscription</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Déjà inscrit ?{' '}
        <Link href="/connexion" className="text-primary hover:underline">
          Connexion
        </Link>
      </p>
      <div className="mt-6">
        <StepIndicator step={step} total={4} labels={steps} />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {step === 1 ? (
          <>
            <Input label="Nom complet" error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <div>
              <label className="mb-2 block text-sm text-ink-secondary">Pays de résidence</label>
              <select className="input-field" {...register('countryResidence')}>
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
          <Input
            label="Mot de passe"
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />
        ) : null}
        {step === 4 ? (
          <div className="space-y-3 text-sm text-ink-secondary">
            <p>
              <span className="text-ink-faint">Nom :</span> {watch('name')}
            </p>
            <p>
              <span className="text-ink-faint">Email :</span> {watch('email')}
            </p>
            <p>
              <span className="text-ink-faint">Pays :</span> {watch('countryResidence')}
            </p>
            <p>
              <span className="text-ink-faint">WhatsApp Mali :</span>{' '}
              {watch('phoneMali')
                ? `+223 ${watch('phoneMali').replace(/(\d{2})(?=\d)/g, '$1 ').trim()}`
                : '—'}
            </p>
            <p>
              <span className="text-ink-faint">WhatsApp Russie :</span>{' '}
              {watch('phoneRussia')
                ? `+7 ${watch('phoneRussia').replace(/(\d{3})(?=\d)/g, '$1 ').trim()}`
                : '—'}
            </p>
          </div>
        ) : null}

        <div className="flex gap-3 pt-2">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              Retour
            </Button>
          ) : null}
          {step < 4 ? (
            <Button type="button" className="flex-1" onClick={() => void nextStep()}>
              Continuer
            </Button>
          ) : (
            <Button type="submit" className="flex-1" loading={isSubmitting}>
              Créer mon compte
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
