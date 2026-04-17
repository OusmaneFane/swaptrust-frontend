'use client';

import { useSession } from 'next-auth/react';
import { useChat } from '@/hooks/useChat';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { Skeleton } from '@/components/ui/Skeleton';
import { sameUserId } from '@/lib/same-user';

export function ChatWindow({ transactionId }: { transactionId: number }) {
  const { data: session, status } = useSession();
  const token = session?.accessToken ?? '';
  const sessionUserId = session?.user?.id;
  const { messages, isTyping, sendMessage } = useChat(transactionId, token);

  if (status === 'loading') {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="ml-auto h-12 w-2/3" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-2 pb-32 lg:pb-4">
        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            message={m}
            isMine={sameUserId(sessionUserId, m.senderId)}
          />
        ))}
        {isTyping ? (
          <p className="text-xs text-text-muted">L’autre partie est en train d’écrire…</p>
        ) : null}
      </div>
      <ChatInput onSend={sendMessage} disabled={!token} />
    </div>
  );
}
