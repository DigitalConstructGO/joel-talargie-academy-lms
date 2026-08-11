'use client';

import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { NotificationSkeleton } from '@/components/dashboard/skeletons/notification-skeleton';
import { NotificationCard } from '@/components/dashboard/notification-card';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationsRead,
  useMyNotifications,
  useUnreadNotificationsCount,
} from '@/features/notifications/hooks/use-notifications';
import { formatRelativeTime } from '@/lib/format';

export function NotificationBell() {
  const { data: notifications, isLoading } = useMyNotifications({ pageSize: 6 });
  const { data: unread } = useUnreadNotificationsCount();
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = unread?.unreadCount ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {isLoading ? (
          <NotificationSkeleton count={4} className="p-1" />
        ) : !notifications || notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description="New notifications will appear here."
            className="border-none bg-transparent p-6"
          />
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto p-1">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <NotificationCard
                  title={notification.title}
                  description={notification.message}
                  timestamp={formatRelativeTime(notification.createdAt)}
                  read={notification.readAt !== null}
                  onClick={
                    notification.readAt === null
                      ? () => markRead.mutate([notification.id])
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
