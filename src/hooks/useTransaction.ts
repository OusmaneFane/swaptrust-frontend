'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTransaction,
  confirmSend,
  confirmReceive,
  cancelTransaction,
} from '@/services/transactionService';
import { toast } from 'sonner';

export function useTransaction(id: number) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => fetchTransaction(id),
    enabled: Number.isFinite(id),
  });
}

export function useConfirmSend(transactionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proofFile: File) => confirmSend(transactionId, proofFile),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transaction', transactionId] });
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Envoi confirmé');
    },
    onError: () => toast.error('Confirmation impossible'),
  });
}

export function useConfirmReceive(transactionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => confirmReceive(transactionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transaction', transactionId] });
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Réception confirmée');
    },
    onError: () => toast.error('Action impossible'),
  });
}

export function useCancelTransaction(transactionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cancelTransaction(transactionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transaction', transactionId] });
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction annulée');
    },
    onError: () => toast.error('Annulation impossible'),
  });
}
