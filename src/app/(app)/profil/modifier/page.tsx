'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { WhatsappSection } from '@/components/profile/WhatsappSection';
import axios from 'axios';
import { PHONE_SEND_DIAL_OPTIONS } from '@/constants/phone-send-dial';
import {
  profileMaliToApi,
  profileRussiaToApi,
  universalPhonePayload,
} from '@/lib/phone-api-format';
import { authApi, usersApi } from '@/services/api';

const schema = z
  .object({
    name: z.string().min(2),
    phone: z.string().optional(),
    countryCallingCode: z.string().optional(),
    countryIso2: z.string().optional(),
    phoneMali: z.string().optional(),
    phoneRussia: z.string().optional(),
    countryResidence: z.enum(['MALI', 'RUSSIA', 'OTHER']).optional(),
  })
  .superRefine((data, ctx) => {
    const p = data.phone?.trim() ?? '';
    if (p) {
      const isE164 = /^\+\d{7,15}$/.test(p);
      if (!isE164) {
        const cc = (data.countryCallingCode ?? '').replace(/\D/g, '');
        if (!cc) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Indicatif requis si le téléphone n’est pas en E.164 (+...)',
            path: ['countryCallingCode'],
          });
        }
      }
    }
    if (data.phoneMali?.trim() && !profileMaliToApi(data.phoneMali)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mali : 8 chiffres ou 223 + 8 chiffres (sans +)',
        path: ['phoneMali'],
      });
    }
    if (data.phoneRussia?.trim() && !profileRussiaToApi(data.phoneRussia)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Russie : 10 chiffres ou 7 + 10 chiffres (sans +)',
        path: ['phoneRussia'],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function ModifierProfilPage() {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);

  const { data: me, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (me) {
      reset({
        name: me.name,
        phone: me.phone ?? '',
        countryCallingCode: '',
        countryIso2: '',
        phoneMali: me.phoneMali ?? '',
        phoneRussia: me.phoneRussia ?? '',
        countryResidence: me.countryResidence,
      });
    }
  }, [me, reset]);

  const updateMut = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Profil mis à jour');
    },
    onError: (err: unknown) => {
      const ax = axios.isAxiosError(err);
      const status = ax ? err.response?.status : undefined;
      const msg =
        ax && typeof err.response?.data === 'object' && err.response?.data !== null
          ? (err.response?.data as Record<string, unknown>).message
          : undefined;
      if (status === 409 && typeof msg === 'string' && msg.includes('Phone number already in use')) {
        toast.error('Numéro déjà utilisé');
        return;
      }
      toast.error('Mise à jour impossible');
    },
  });

  const avatarMut = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      setPreview(null);
      toast.success('Avatar mis à jour');
    },
    onError: () => toast.error('Upload impossible'),
  });

  function onSubmit(values: FormValues) {
    const m = values.phoneMali?.trim();
    const r = values.phoneRussia?.trim();
    const uni = universalPhonePayload({
      phoneRaw: values.phone,
      countryCallingCodeDigits: values.countryCallingCode,
      countryIso2: values.countryIso2,
    });
    updateMut.mutate({
      name: values.name,
      ...uni,
      phoneMali: m ? profileMaliToApi(m) ?? undefined : undefined,
      phoneRussia: r ? profileRussiaToApi(r) ?? undefined : undefined,
      countryResidence: values.countryResidence,
    });
  }

  return (
    <Card className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="font-display text-xl font-bold text-text-dark">Modifier le profil</h1>
      {isLoading ? (
        <p className="text-sm text-text-muted">Chargement…</p>
      ) : (
        <>
          {me ? <WhatsappSection user={me} /> : null}
          <div>
            <label className="mb-2 block text-sm text-slate-600">Avatar</label>
            {preview || me?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview ?? me?.avatar ?? ''}
                alt=""
                className="mb-2 h-24 w-24 rounded-full object-cover ring-2 ring-primary/15"
              />
            ) : null}
            <input
              type="file"
              accept="image/*"
              className="text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setPreview(URL.createObjectURL(f));
                avatarMut.mutate(f);
              }}
            />
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Nom" error={errors.name?.message} {...register('name')} />
            <Input
              label="Téléphone principal (E.164 ou national)"
              placeholder="+22370123456"
              {...register('phone')}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-600">Indicatif (si national)</label>
                <select className="input-field-surface" {...register('countryCallingCode')}>
                  <option value="">—</option>
                  {PHONE_SEND_DIAL_OPTIONS.map((o) => (
                    <option key={`${o.iso2}-${o.dial}`} value={o.dial}>
                      {o.label} (+{o.dialDisplay})
                    </option>
                  ))}
                </select>
                {errors.countryCallingCode?.message ? (
                  <p className="mt-1 text-xs text-danger">{errors.countryCallingCode.message}</p>
                ) : null}
              </div>
              <Input
                label="ISO2 (optionnel)"
                placeholder="FR"
                {...register('countryIso2')}
              />
            </div>
            <Input label="Téléphone Mali" {...register('phoneMali')} />
            <Input label="Téléphone Russie" {...register('phoneRussia')} />
            <div>
              <label className="mb-2 block text-sm text-slate-600">Pays</label>
              <select className="input-field-surface" {...register('countryResidence')}>
                <option value="">—</option>
                <option value="MALI">Mali</option>
                <option value="RUSSIA">Russie</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <Button
              type="submit"
              className="w-full"
              loading={updateMut.isPending}
            >
              Enregistrer
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}
