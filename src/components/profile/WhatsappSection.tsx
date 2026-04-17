'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { flexiblePhoneToApi } from '@/lib/phone-api-format';
import { authApi, usersApi } from '@/services/api';
import type { User } from '@/types/user';
import type { UpdateUserDto } from '@/types/api-dtos';

const WHATSAPP_ICON_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

const phoneInputSchema = z
  .string()
  .trim()
  .min(1, 'Numéro requis')
  .superRefine((val, ctx) => {
    if (!flexiblePhoneToApi(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Mali : 223 + 8 chiffres (ou 8 chiffres). Russie : 7 + 10 chiffres (ou 10 chiffres). Sans espaces, le + est optionnel.',
      });
    }
  });

function dtoForVerifiedPhone(apiDigits: string): UpdateUserDto {
  if (apiDigits.startsWith('223')) return { phoneMali: apiDigits };
  if (apiDigits.startsWith('7')) return { phoneRussia: apiDigits };
  return {};
}

function subtitleWhatsapp(user: User): string {
  const p = user.whatsappPhone ?? user.phoneMali ?? user.phoneRussia;
  return p ? `Actif sur ${p}` : 'Non configuré';
}

export function WhatsappSection({ user }: { user: User }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otp, setOtp] = useState('');

  const sendOtpMutation = useMutation({
    mutationFn: (phone: string) => authApi.sendOtp(phone),
    onSuccess: () => setStep('otp'),
    onError: () => toast.error('Envoi du code impossible'),
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const parsed = phoneInputSchema.safeParse(newPhone);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
      const api = flexiblePhoneToApi(parsed.data);
      if (!api) throw new Error('Numéro invalide');
      await authApi.verifyOtp(api, otp);
      const dto = dtoForVerifiedPhone(api);
      if (Object.keys(dto).length) await usersApi.updateMe(dto);
    },
    onSuccess: async () => {
      toast.success('Numéro WhatsApp mis à jour !');
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      setEditing(false);
      setStep('input');
      setNewPhone('');
      setOtp('');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Code invalide';
      toast.error(msg);
    },
  });

  function resetEditing() {
    setEditing(false);
    setStep('input');
    setNewPhone('');
    setOtp('');
  }

  function onSendCode() {
    const parsed = phoneInputSchema.safeParse(newPhone);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Numéro invalide');
      return;
    }
    const api = flexiblePhoneToApi(parsed.data);
    if (!api) {
      toast.error('Numéro invalide');
      return;
    }
    sendOtpMutation.mutate(api);
  }

  return (
    <div className="space-y-4 rounded-card border border-primary/10 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="#25D366"
              aria-hidden
            >
              <path d={WHATSAPP_ICON_PATH} />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-dark">Notifications WhatsApp</p>
            <p className="truncate text-xs text-text-muted">{subtitleWhatsapp(user)}</p>
          </div>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-pill border border-primary/30 px-3 py-1 text-sm text-primary transition-colors hover:bg-primary/10"
          >
            Modifier
          </button>
        ) : null}
      </div>

      {!editing ? (
        <div className="space-y-2">
          {user.phoneMali ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Mali</span>
              <span className="font-mono text-text-dark">{user.phoneMali}</span>
            </div>
          ) : null}
          {user.phoneRussia ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Russie</span>
              <span className="font-mono text-text-dark">{user.phoneRussia}</span>
            </div>
          ) : null}
          {!user.phoneMali && !user.phoneRussia ? (
            <p className="text-xs text-danger">
              Aucun numéro — vous ne recevrez pas de notifications WhatsApp
            </p>
          ) : null}
        </div>
      ) : null}

      {editing && step === 'input' ? (
        <div className="space-y-3">
          <input
            type="tel"
            placeholder="22370123456 ou 79961234567 (+ optionnel)"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="input-field-surface w-full"
            autoComplete="tel"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => resetEditing()}
              className="flex-1 rounded-input border border-primary/15 bg-slate-50 py-2 text-sm text-text-muted transition hover:bg-primary/[0.04]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => onSendCode()}
              disabled={!newPhone.trim() || sendOtpMutation.isPending}
              className="btn-primary flex-1 py-2 text-sm"
            >
              {sendOtpMutation.isPending ? 'Envoi…' : 'Envoyer le code'}
            </button>
          </div>
        </div>
      ) : null}

      {editing && step === 'otp' ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Code envoyé sur <span className="font-medium text-text-dark">{newPhone.trim()}</span> par WhatsApp
          </p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Code à 6 chiffres"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="input-field-surface w-full text-center text-xl tracking-widest"
            autoComplete="one-time-code"
          />
          <button
            type="button"
            onClick={() => verifyMutation.mutate()}
            disabled={otp.length !== 6 || verifyMutation.isPending}
            className="btn-primary w-full"
          >
            {verifyMutation.isPending ? 'Vérification…' : 'Confirmer'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
