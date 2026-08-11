'use client';

import { useMemo } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { SearchBar } from '@/components/common/search-bar';
import { ContentContainer } from '@/components/layout/content-container';
import { NotificationCard } from '@/components/dashboard/notification-card';
import { NotificationSkeleton } from '@/components/dashboard/skeletons/notification-skeleton';
import {
  NoNotificationsEmptyState,
  NoSearchResultsEmptyState,
} from '@/components/dashboard/empty-states';
import { DashboardApiErrorState } from '@/components/dashboard/error-states';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryFilters } from '@/hooks/use-query-filters';
import {
  useArchiveNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationsRead,
  useMyNotifications,
} from '@/features/notifications/hooks/use-notifications';
import { formatRelativeTime } from '@/lib/format';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/constants/routes';

interface NotificationsFilters {
  [key: string]: string | undefined;
  readState: 'ALL' | 'UNREAD' | 'READ';
  search: string | undefined;
  sort: 'newest' | 'oldest';
}

const DEFAULT_FILTERS: NotificationsFilters = {
  readState: 'ALL',
  search: undefined,
  sort: 'newest',
};

/** Reuses `features/notifications/` - `/me/notifications` is role-agnostic (no `@Roles()` guard), so this is the admin's own notification inbox, the exact same real data as the student Notifications page. */
export default function AdminNotificationsPage() {
  const { filters, setFilter, resetFilters } = useQueryFilters<NotificationsFilters>({
    defaults: DEFAULT_FILTERS,
  });
  const { readState, search, sort } = filters;

  const notificationsQuery = useMyNotifications({
    pageSize: 50,
    unread: readState === 'ALL' ? undefined : readState === 'UNREAD',
    search: search || undefined,
  });
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();
  const archiveNotification = useArchiveNotification();

  const notificationsData = notificationsQuery.data;
  // Search/read-state are already applied backend-side (see useMyNotifications
  // above) - only sort order (no backend param for it yet) is applied here.
  const filtered = useMemo(() => {
    return [...(notificationsData ?? [])].sort((a, b) =>
      sort === 'newest'
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
  }, [notificationsData, sort]);
  const hasUnread = (notificationsData ?? []).some((notification) => notification.readAt === null);
  const hasActiveFilters = readState !== 'ALL' || Boolean(search);

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success('All notifications marked as read'),
      onError: () => toast.error('Could not mark notifications as read', 'Please try again.'),
    });
  }

  function handleArchive(id: string) {
    archiveNotification.mutate(id, {
      onSuccess: () => toast.success('Notification archived'),
      onError: () => toast.error('Could not archive that notification', 'Please try again.'),
    });
  }

  function handleMarkRead(id: string) {
    markRead.mutate([id], {
      onSuccess: () => toast.success('Marked as read'),
      onError: () => toast.error('Could not mark that notification as read', 'Please try again.'),
    });
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Communication', href: ROUTES.admin.communication },
          { label: 'Notifications' },
        ]}
      />
      <PageHeader
        title="Notifications"
        description="Your notifications as an administrator."
        actions={
          hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className="gap-2"
            >
              <CheckCheck className="size-4" />
              Mark all as read
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={readState}
          onValueChange={(value) =>
            setFilter('readState', value as NotificationsFilters['readState'])
          }
        >
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="UNREAD">Unread</TabsTrigger>
            <TabsTrigger value="READ">Read</TabsTrigger>
          </TabsList>
        </Tabs>
        <SearchBar
          placeholder="Search notifications..."
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
          aria-label="Search notifications"
        />
      </div>

      <FilterBar>
        <Select
          value={sort}
          onValueChange={(value) => setFilter('sort', value as NotificationsFilters['sort'])}
        >
          <SelectTrigger className="w-40" aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {notificationsQuery.isLoading ? (
        <NotificationSkeleton count={6} />
      ) : notificationsQuery.isError ? (
        <DashboardApiErrorState onRetry={() => notificationsQuery.refetch()} />
      ) : filtered.length === 0 ? (
        hasActiveFilters ? (
          <NoSearchResultsEmptyState
            action={
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            }
          />
        ) : (
          <NoNotificationsEmptyState />
        )
      ) : (
        <ul className="flex flex-col gap-1 rounded-xl border border-border bg-card p-2">
          {filtered.map((notification) => (
            <li key={notification.id}>
              <NotificationCard
                icon={Bell}
                title={notification.title}
                description={notification.message}
                timestamp={formatRelativeTime(notification.createdAt)}
                read={notification.readAt !== null}
                onClick={
                  notification.readAt === null ? () => handleMarkRead(notification.id) : undefined
                }
                onArchive={() => handleArchive(notification.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </ContentContainer>
  );
}
