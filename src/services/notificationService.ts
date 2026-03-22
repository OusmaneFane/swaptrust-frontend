import type { AppNotification } from '@/types/api-dtos';
import { notificationsApi } from '@/services/api';

export type { AppNotification };

export async function fetchNotifications(): Promise<AppNotification[]> {
  return notificationsApi.list();
}

export async function markAllRead(): Promise<void> {
  await notificationsApi.markAllRead();
}
