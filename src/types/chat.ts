export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';

export interface Message {
  id: number;
  transactionId: number;
  senderId: number;
  content: string;
  type: MessageType;
  attachmentUrl: string | null;
  createdAt: string;
}

export interface ChatAttachment {
  url: string;
  name: string;
}
