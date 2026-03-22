'use client';

import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = value.trim();
    if (!t) return;
    onSend(t);
    setValue('');
  }

  return (
    <form
      onSubmit={submit}
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-card/95 p-3 pb-safe shadow-nav backdrop-blur-lg lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0"
    >
      <div className="mx-auto flex max-w-3xl gap-2 lg:mx-0">
        <input
          className="input-field flex-1 py-3"
          placeholder="Votre message…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
        />
        <Button
          type="submit"
          disabled={disabled || !value.trim()}
          className="shrink-0 px-4"
          aria-label="Envoyer le message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
