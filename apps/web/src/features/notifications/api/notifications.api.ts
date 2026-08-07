import { authClient, unwrap } from '@/lib/api/auth-client';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { mockNotificationsApi } from '../data/mock-notifications.api';
import type { NotificationListParams, NotificationListResult } from '../types/notification.types';

const cleanParams = <T extends object>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  );

/** Talks to the real backend's authenticated `/me/notifications` endpoints. */
const liveNotificationsApi = {
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

/** Same mock/live switch as `catalogApi` - flips with `NEXT_PUBLIC_CATALOG_DATA_SOURCE`. */
export const notificationsApi =
  CATALOG_DATA_SOURCE === 'live' ? liveNotificationsApi : mockNotificationsApi;
