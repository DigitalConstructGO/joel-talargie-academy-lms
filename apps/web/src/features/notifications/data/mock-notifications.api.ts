import { MOCK_NOTIFICATIONS } from './mock-notifications.data';
import type {
  Notification,
  NotificationListParams,
  NotificationListResult,
} from '../types/notification.types';

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Module-level mutable copy so mark-as-read/archive have somewhere to write in mock mode. */
let store: Notification[] = MOCK_NOTIFICATIONS.map((notification) => ({ ...notification }));

function filterNotifications(params: NotificationListParams) {
  return store
    .filter((notification) => {
      if (params.unread !== undefined && params.unread !== (notification.readAt === null))
        return false;
      if (params.type && notification.type !== params.type) return false;
      if (params.priority && notification.priority !== params.priority) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const mockNotificationsApi = {
  listMine: async (params: NotificationListParams = {}): Promise<NotificationListResult> => {
    const filtered = filterNotifications(params);
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return delay(filtered.slice(start, start + pageSize));
  },

  unreadCount: async (): Promise<{ unreadCount: number }> =>
    delay({ unreadCount: store.filter((notification) => notification.readAt === null).length }),

  markRead: async (ids: string[]): Promise<{ updated: number }> => {
    let updated = 0;
    store = store.map((notification) => {
      if (ids.includes(notification.id) && notification.readAt === null) {
        updated += 1;
        return { ...notification, readAt: new Date().toISOString() };
      }
      return notification;
    });
    return delay({ updated });
  },

  markAllRead: async (): Promise<{ updated: number }> => {
    let updated = 0;
    store = store.map((notification) => {
      if (notification.readAt === null) {
        updated += 1;
        return { ...notification, readAt: new Date().toISOString() };
      }
      return notification;
    });
    return delay({ updated });
  },

  archive: async (id: string): Promise<{ archived: boolean }> => {
    const existed = store.some((notification) => notification.id === id);
    store = store.filter((notification) => notification.id !== id);
    return delay({ archived: existed });
  },
};
