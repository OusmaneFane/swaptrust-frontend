'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useClientSendProof } from '@/hooks/useTransaction';

type Props = {
  transactionId: number;
  onWhatsappNotify?: () => void;
};

export function ClientSendButton({ transactionId, onWhatsappNotify }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const mutation = useClientSendProof(transactionId);

  return (
    <div className="space-y-3">
      <label className="glass-card flex cursor-pointer flex-col items-center gap-2 border border-dashed border-primary/30 p-4 transition-colors hover:border-primary/60">
        <Upload className="text-primary" size={24} />
        <span className="text-center text-sm text-ink-muted">
          Appuyez pour prendre une photo ou choisir un fichier
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setPreview(URL.createObjectURL(f));
            }
          }}
        />
      </label>
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Aperçu du reçu"
            className="max-h-48 w-full rounded-card object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
            className="absolute right-2 top-2 rounded-full bg-danger/80 p-1 text-white"
            aria-label="Retirer l’image"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="btn-primary w-full"
        disabled={!file || mutation.isPending}
        onClick={() =>
          file &&
          mutation.mutate(file, {
            onSuccess: () => onWhatsappNotify?.(),
          })
        }
      >
        {mutation.isPending ? 'Envoi en cours…' : 'Confirmer l’envoi'}
      </button>
    </div>
  );
}
