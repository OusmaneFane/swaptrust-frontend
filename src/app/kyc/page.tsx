'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Camera } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/exchange/StepIndicator';
import { LogoutButton } from '@/components/layout/LogoutButton';
import { Spinner } from '@/components/ui/Spinner';
import { kycApi } from '@/services/api';
import { KYC_DOC_TYPE_OPTIONS } from '@/constants/kyc-doc-types';
import { toast } from 'sonner';

const labels = ['Pièce d’identité', 'Selfie'];

async function videoFrameToJpegFile(
  video: HTMLVideoElement,
  filename: string,
): Promise<File> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) throw new Error('Vidéo non prête');
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponible');
  ctx.drawImage(video, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92),
  );
  if (!blob) throw new Error('Capture impossible');
  return new File([blob], filename, { type: 'image/jpeg' });
}

export default function KycPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { update } = useSession();
  const redirectedRef = useRef(false);

  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState<string>(
    KYC_DOC_TYPE_OPTIONS[0]?.value ?? 'NATIONAL_ID',
  );
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: kyc, isPending: statusLoading, isError: statusError } = useQuery({
    queryKey: ['kyc', 'status'],
    queryFn: kycApi.getStatus,
    refetchInterval: (q) =>
      q.state.data?.status === 'PENDING' ? 10_000 : false,
  });

  useEffect(() => {
    if (kyc?.status !== 'VERIFIED' || redirectedRef.current) return;
    redirectedRef.current = true;
    void (async () => {
      await update({ kycStatus: 'VERIFIED' });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      router.replace('/tableau-de-bord');
    })();
  }, [kyc?.status, update, queryClient, router]);

  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        toast.error('Caméra refusée ou indisponible');
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [step]);

  const submitMut = useMutation({
    mutationFn: kycApi.submit,
    onSuccess: async () => {
      await update({ kycStatus: 'PENDING' });
      await queryClient.invalidateQueries({ queryKey: ['kyc', 'status'] });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setFrontFile(null);
      setBackFile(null);
      setSelfieFile(null);
      setStep(1);
      toast.success('Dossier transmis. Validation sous peu.');
    },
    onError: () => toast.error('Envoi impossible. Réessayez.'),
  });

  function goStep2() {
    if (!frontFile || !backFile) {
      toast.error('Ajoutez le recto et le verso');
      return;
    }
    setStep(2);
  }

  async function captureSelfie() {
    const v = videoRef.current;
    if (!v) return;
    try {
      const file = await videoFrameToJpegFile(v, 'selfie.jpg');
      setSelfieFile(file);
      toast.success('Selfie enregistré');
    } catch {
      toast.error('Capture impossible — réessayez');
    }
  }

  function submit() {
    if (!docType.trim()) {
      toast.error('Choisissez le type de pièce');
      return;
    }
    if (!frontFile || !backFile || !selfieFile) {
      toast.error('Documents incomplets');
      return;
    }
    submitMut.mutate({
      docType: docType.trim(),
      front: frontFile,
      back: backFile,
      selfie: selfieFile,
    });
  }

  if (statusLoading && !kyc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-app px-4">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-ink-muted">Chargement du dossier…</p>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Card className="space-y-4 p-8">
          <p className="text-sm text-danger">Impossible de charger le statut KYC.</p>
          <Button type="button" className="w-full" onClick={() => queryClient.invalidateQueries({ queryKey: ['kyc', 'status'] })}>
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  const st = kyc?.status;

  if (st === 'VERIFIED') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-app px-4">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-ink-muted">Compte vérifié — redirection…</p>
      </div>
    );
  }

  if (st === 'PENDING') {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-app px-4 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold">Vérification d’identité</h1>
          <LogoutButton label="always" />
        </div>
        <Card className="p-8 text-center">
          <p className="font-display text-lg font-semibold">Dossier en attente</p>
          <p className="mt-3 text-sm text-ink-muted">
            Un administrateur doit valider vos documents. Vous recevrez l’accès au tableau
            de bord une fois le compte approuvé. Cette page se met à jour automatiquement.
          </p>
          <div className="mt-6 flex justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        </Card>
      </div>
    );
  }

  const canSubmit = st === 'NOT_SUBMITTED' || st === 'REJECTED';

  if (!canSubmit && st) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-ink-muted">
        Statut inconnu. Rechargez la page.
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg space-y-6 bg-app px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Vérification d’identité</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Obligatoire pour accéder au tableau de bord et aux échanges.
          </p>
        </div>
        <LogoutButton label="always" />
      </div>

      {st === 'REJECTED' && kyc.rejectionNote ? (
        <Card className="border-danger/40 bg-danger/5 p-4 text-sm text-ink">
          <p className="font-medium text-danger">Dossier refusé</p>
          <p className="mt-2 text-ink-secondary">{kyc.rejectionNote}</p>
          <p className="mt-2 text-ink-muted">Vous pouvez soumettre de nouveaux documents ci-dessous.</p>
        </Card>
      ) : null}

      <StepIndicator step={step} total={2} labels={labels} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
        >
          {step === 1 ? (
            <Card className="space-y-5 p-6">
              <p className="text-sm text-ink-secondary">
                Formats acceptés : JPG, PNG. Assurez-vous que les informations sont lisibles.
              </p>
              <div className="space-y-2">
                <label htmlFor="kyc-doc-type" className="block text-sm font-medium text-ink">
                  Type de pièce d’identité
                </label>
                <select
                  id="kyc-doc-type"
                  className="w-full rounded-input border border-line bg-card px-3 py-2.5 text-sm text-ink shadow-sm"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  {KYC_DOC_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-ink">Recto</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-input border border-dashed border-line py-8 text-sm text-ink-muted transition-colors hover:border-primary/40">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setFrontFile(f ?? null);
                    }}
                  />
                  {frontFile ? frontFile.name : 'Choisir le recto'}
                </label>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-ink">Verso</label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-input border border-dashed border-line py-8 text-sm text-ink-muted transition-colors hover:border-primary/40">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setBackFile(f ?? null);
                    }}
                  />
                  {backFile ? backFile.name : 'Choisir le verso'}
                </label>
              </div>
              <Button type="button" className="w-full" onClick={goStep2}>
                Continuer
              </Button>
            </Card>
          ) : null}

          {step === 2 ? (
            <Card className="space-y-5 p-6">
              <p className="text-sm text-ink-secondary">
                Placez votre visage au centre du cadre, puis capturez. Vous pouvez aussi importer une photo.
              </p>
              <div className="relative aspect-video overflow-hidden rounded-input bg-muted">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 sm:flex-1"
                  onClick={() => void captureSelfie()}
                >
                  <Camera className="h-4 w-4 shrink-0" />
                  Capturer le selfie
                </Button>
                <label className="flex w-full flex-1 cursor-pointer items-center justify-center rounded-input border border-line px-4 py-2.5 text-center text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-hover">
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setSelfieFile(f ?? null);
                      if (f) toast.success('Photo importée');
                    }}
                  />
                  Importer une photo
                </label>
              </div>
              {selfieFile ? (
                <p className="text-center text-xs text-success">
                  <Check className="mr-1 inline h-3.5 w-3.5" />
                  Selfie prêt : {selfieFile.name}
                </p>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:flex-1"
                  onClick={() => setStep(1)}
                >
                  Retour
                </Button>
                <Button
                  type="button"
                  className="w-full sm:flex-1"
                  loading={submitMut.isPending}
                  onClick={() => submit()}
                >
                  Envoyer le dossier
                </Button>
              </div>
            </Card>
          ) : null}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
