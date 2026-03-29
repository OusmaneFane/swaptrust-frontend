'use client';

import { useEffect, useState } from 'react';
import { Download, Maximize2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { proofsApi } from '@/services/api';
import { extractProofFilename } from '@/lib/extract-proof-filename';

type Props = {
  /** Valeur renvoyée par l’API, ex. `proofs/uuid.jpg`. */
  url: string;
  label?: string;
};

function isPdf(contentType: string, filename: string): boolean {
  return (
    contentType.toLowerCase().includes('pdf') ||
    filename.toLowerCase().endsWith('.pdf')
  );
}

export function ProofViewer({ url, label = 'Reçu' }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState('');
  const [filename, setFilename] = useState('');

  useEffect(() => {
    let cancelled = false;

    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setLoading(true);
    setError(null);
    setContentType('');
    setFilename('');

    void (async () => {
      const fn = extractProofFilename(url);
      if (!fn) {
        if (!cancelled) {
          setError('Référence de preuve invalide.');
          setLoading(false);
        }
        return;
      }

      try {
        const { blob, contentType: ct } = await proofsApi.getBlob(fn);
        if (cancelled) return;
        if (blob.size === 0) {
          setError('Fichier vide ou introuvable.');
          setLoading(false);
          return;
        }
        const u = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        setObjectUrl(u);
        setContentType(ct);
        setFilename(fn);
      } catch {
        if (!cancelled) {
          setError('Impossible de charger la preuve (droits ou réseau).');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [url]);

  function download() {
    if (!objectUrl || !filename) return;
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const pdf = Boolean(objectUrl && isPdf(contentType, filename));

  return (
    <>
      <div className="relative overflow-hidden rounded-card border border-line bg-surface/50">
        {loading ? (
          <Skeleton className="h-56 w-full rounded-none" />
        ) : error ? (
          <div className="p-6 text-center text-sm text-danger">{error}</div>
        ) : pdf ? (
          <iframe
            title={label}
            src={objectUrl!}
            className="h-56 w-full border-0 bg-white"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={objectUrl!}
            alt={label}
            className="max-h-56 w-full object-contain"
          />
        )}
        <div className="flex flex-wrap gap-2 border-t border-line bg-card/90 p-2">
          <Button
            type="button"
            variant="outline"
            className="gap-1 py-1.5 text-xs"
            disabled={!objectUrl}
            onClick={() => setOpen(true)}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Voir en grand
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-1 py-1.5 text-xs"
            disabled={!objectUrl}
            onClick={download}
          >
            <Download className="h-3.5 w-3.5" />
            Télécharger
          </Button>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={label}>
        <div className="max-h-[70vh] overflow-auto">
          {objectUrl && pdf ? (
            <iframe
              title={label}
              src={objectUrl}
              className="min-h-[70vh] w-full border-0 bg-white"
            />
          ) : objectUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={objectUrl} alt={label} className="w-full object-contain" />
          ) : null}
        </div>
      </Modal>
    </>
  );
}
