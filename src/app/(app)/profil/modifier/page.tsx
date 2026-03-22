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
import { authApi, usersApi } from '@/services/api';

const schema = z.object({
  name: z.string().min(2),
  phoneMali: z.string().optional(),
  phoneRussia: z.string().optional(),
  countryResidence: z.enum(['MALI', 'RUSSIA', 'OTHER']).optional(),
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
    onError: () => toast.error('Mise à jour impossible'),
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
    updateMut.mutate({
      name: values.name,
      phoneMali: values.phoneMali || undefined,
      phoneRussia: values.phoneRussia || undefined,
      countryResidence: values.countryResidence,
    });
  }

  return (
    <Card className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="font-display text-xl font-bold">Modifier le profil</h1>
      {isLoading ? (
        <p className="text-sm text-ink-muted">Chargement…</p>
      ) : (
        <>
          <div>
            <label className="mb-2 block text-sm text-ink-secondary">Avatar</label>
            {preview || me?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview ?? me?.avatar ?? ''}
                alt=""
                className="mb-2 h-24 w-24 rounded-full object-cover ring-2 ring-line"
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
            <Input label="Téléphone Mali" {...register('phoneMali')} />
            <Input label="Téléphone Russie" {...register('phoneRussia')} />
            <div>
              <label className="mb-2 block text-sm text-ink-secondary">Pays</label>
              <select className="input-field" {...register('countryResidence')}>
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
