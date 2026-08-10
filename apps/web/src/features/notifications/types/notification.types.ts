export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  priority: NotificationPriority;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListParams {
  page?: number;
  pageSize?: number;
  unread?: boolean;
  type?: string;
  priority?: NotificationPriority;
  /** Matched against title and body (case-insensitive substring) - backend-driven, not client-side. */
  search?: string;
}

/**
 * The backend's `GET /me/notifications` returns a bare array (no
 * total/pagination wrapper) - `listMine` just proxies the repository's
 * `select()` result straight through. Pages should use a "load more"
 * pattern (append the next page while the last page came back full) rather
 * than numeric pagination, which needs a total this endpoint doesn't give.
 */
export type NotificationListResult = Notification[];
