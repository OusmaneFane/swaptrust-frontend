'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  markAllRead,
} from '@/services/notificationService';
import { useNotificationStore } from '@/stores/notificationStore';
import { useEffect } from 'react';

export function useNotifications() {
  const setUnread = useNotificationStore((s) => s.setUnreadCount);
  const q = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  useEffect(() => {
    if (q.data) {
      setUnread(q.data.filter((n) => !n.read).length);
    }
  }, [q.data, setUnread]);

  return q;
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const clear = useNotificationStore((s) => s.clearUnread);
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      clear();
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
