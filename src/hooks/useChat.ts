'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { fetchMessages } from '@/services/chatService';
import { chatApi } from '@/services/api';
import type { Message } from '@/types/chat';

export function useChat(transactionId: number, token: string) {
  const qc = useQueryClient();
  const { data: initial = [] } = useQuery({
    queryKey: ['chat', transactionId],
    queryFn: () => fetchMessages(transactionId),
    enabled: Number.isFinite(transactionId) && !!token,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMessages(initial);
  }, [initial]);

  useEffect(() => {
    if (!Number.isFinite(transactionId)) return;
    void chatApi.markRead(transactionId);
  }, [transactionId]);

  useEffect(() => {
    if (!token || !Number.isFinite(transactionId)) return;
    const socket = getSocket(token);
    socket.emit('joinTransaction', transactionId);
    const onNew = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      void qc.invalidateQueries({ queryKey: ['chat', transactionId] });
    };
    const onTyping = () => {
      setIsTyping(true);
      window.setTimeout(() => setIsTyping(false), 2000);
    };
    socket.on('newMessage', onNew);
    socket.on('userTyping', onTyping);
    return () => {
      socket.off('newMessage', onNew);
      socket.off('userTyping', onTyping);
    };
  }, [transactionId, token, qc]);

  const sendMessage = useCallback(
    (content: string) => {
      const socket = getSocket(token);
      socket.emit('sendMessage', {
        transactionId,
        content,
        type: 'TEXT',
      });
    },
    [transactionId, token],
  );

  return { messages, isTyping, sendMessage };
}
