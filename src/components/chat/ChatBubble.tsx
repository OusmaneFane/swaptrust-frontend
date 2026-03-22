import { cn, fromNow } from '@/lib/utils';
import type { Message } from '@/types/chat';

export function ChatBubble({
  message,
  isMine,
}: {
  message: Message;
  isMine: boolean;
}) {
  return (
    <div
      className={cn('flex w-full', isMine ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm',
          isMine
            ? 'rounded-br-md bg-gradient-to-br from-primary to-primary-dark text-white'
            : 'rounded-bl-md border border-line bg-surface text-ink',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            'mt-1 text-[10px]',
            isMine ? 'text-white/80' : 'text-ink-muted',
          )}
        >
          {fromNow(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
