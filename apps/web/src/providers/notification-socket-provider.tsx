'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { notificationKeys } from '@/features/notifications/api/query-keys';
import type { Notification } from '@/features/notifications/types/notification.types';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/auth.store';

const NOTIFICATION_NAMESPACE = '/notifications';

/**
 * Mirrors `next.config.ts`'s rewrite target so the browser connects straight
 * to the API origin instead of proxying long-lived WebSocket upgrades through
 * Next.js. In production this is the API origin; when unset it falls back to
 * the same origin (API served behind the web app).
 */
const getSocketOrigin = () => (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

/**
 * Real-time notification delivery. While the user is authenticated this opens
 * a single socket.io connection to `/notifications`, authenticated with the
 * same short-lived JWT access token the REST API uses. The server only ever
 * emits notifications for the authenticated user's own private room.
 *
 * On every new notification the TanStack Query notification queries
 * (list + unread badge) are invalidated so the bell and notification pages
 * update instantly, and a toast announces it. The connection reconnects
 * automatically; on each (re)connect the queries are refetched so anything
 * persisted while the socket was offline is caught up from the API.
 *
 * `socket.io-client` is dynamically imported inside the effect rather than at
 * module scope: its browser bundle is not safe to evaluate during Next.js
 * server-side rendering, and the connection is browser-only anyway.
 */
export function NotificationSocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    let disposed = false;

    const refreshNotifications = () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    };

    void import('socket.io-client').then(({ io }) => {
      if (disposed) return;

      const socket = io(`${getSocketOrigin()}${NOTIFICATION_NAMESPACE}`, {
        auth: { token: accessToken },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: Infinity,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        // First connect or reconnect - refetch so the UI catches up on anything
        // that happened while the socket was offline.
        refreshNotifications();
      });

      socket.on('notification:new', (notification: Notification) => {
        refreshNotifications();
        toast.info(notification.title, notification.message);
      });

      socket.on('connect_error', () => {
        // Non-fatal: the REST API remains the source of truth and socket.io
        // keeps retrying on its own. A rejected JWT (logged out elsewhere) is
        // handled by the auth store's normal session recovery.
      });
    });

    return () => {
      disposed = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, queryClient]);

  return children;
}
