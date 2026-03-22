import type { Message } from '@/types';
import { chatApi } from '@/services/api';

export async function fetchMessages(transactionId: number): Promise<Message[]> {
  return chatApi.getMessages(transactionId);
}

export async function sendMessageHttp(
  transactionId: number,
  content: string,
  type: 'TEXT' | 'IMAGE' = 'TEXT',
): Promise<Message> {
  return chatApi.sendMessage(transactionId, content, type);
}
