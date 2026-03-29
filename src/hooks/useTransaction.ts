'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTransaction,
  clientSendProof,
  clientConfirmReceive,
} from '@/services/transactionService';
import { toast } from 'sonner';

export function useTransaction(id: number) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => fetchTransaction(id),
    enabled: Number.isFinite(id),
  });
}

export function useClientSendProof(transactionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proofFile: File) => clientSendProof(transactionId, proofFile),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transaction', transactionId] });
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Reçu envoyé ! L’opérateur va vérifier.');
    },
    onError: () => toast.error('Envoi impossible'),
  });
}

export function useClientConfirm(transactionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clientConfirmReceive(transactionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transaction', transactionId] });
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Échange terminé avec succès !');
    },
    onError: () => toast.error('Confirmation impossible'),
  });
}
