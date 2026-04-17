import Link from 'next/link';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Card } from '@/components/ui/Card';

export default function TransactionChatPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href={`/transactions/${id}`} className="text-sm text-primary">
          ← Retour
        </Link>
        <h1 className="font-display text-lg font-semibold text-text-dark">Chat</h1>
        <span />
      </div>
      <Card className="min-h-[60vh] flex-1 overflow-hidden p-2">
        <ChatWindow transactionId={id} />
      </Card>
    </div>
  );
}
