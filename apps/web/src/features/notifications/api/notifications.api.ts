import { authClient, unwrap } from '@/lib/api/auth-client';
import type { NotificationListParams, NotificationListResult } from '../types/notification.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

/**
 * Talks to the real backend's authenticated `/me/notifications` endpoints.
 * There is deliberately no mock variant anymore - notifications are real,
 * per-user, event-driven records, so the UI always reads the authenticated
 * user's own data from the API.
 */
export const notificationsApi = {
  listMine: async (params: NotificationListParams = {}) =>
    unwrap<NotificationListResult>(
      await authClient.get('/me/notifications', { params: cleanParams(params) }),
    ),

  unreadCount: async () =>
    unwrap<{ unreadCount: number }>(await authClient.get('/me/notifications/unread-count')),

  /** Bulk endpoint used for both single and multi mark-as-read - it accepts an array of any length. */
  markRead: async (ids: string[]) =>
    unwrap<{ updated: number }>(
      await authClient.patch('/me/notifications/read', { notificationIds: ids }),
    ),

  markAllRead: async () =>
    unwrap<{ updated: number }>(await authClient.patch('/me/notifications/read-all')),

  archive: async (id: string) =>
    unwrap<{ archived: boolean }>(
      await authClient.delete(`/me/notifications/${encodeURIComponent(id)}`),
    ),
};
