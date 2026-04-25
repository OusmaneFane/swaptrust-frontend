'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-primary/10 bg-white p-5 pb-safe shadow-card-lg animate-slide-up',
          'lg:bottom-auto lg:left-1/2 lg:right-auto lg:top-1/2 lg:w-[min(560px,calc(100vw-2rem))] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl',
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
        {title ? (
          <h2 className="mb-4 font-display text-lg font-semibold text-text-dark">{title}</h2>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
