'use client';

import { useMemo, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
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
import { SavedFiltersMenu } from '@/components/dashboard/filters/saved-filters-menu';
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
import { useSavedFilters } from '@/hooks/use-saved-filters';
import {
  useArchiveNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationsRead,
  useMyNotifications,
} from '@/features/notifications/hooks/use-notifications';
import { formatRelativeTime } from '@/lib/format';
import { toast } from '@/lib/toast';

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

const PAGE_SIZE = 50;

export default function StudentNotificationsPage() {
  const { filters, setFilter, setFilters, resetFilters } = useQueryFilters<NotificationsFilters>({
    defaults: DEFAULT_FILTERS,
  });
  const { readState, search, sort } = filters;
  const { presets, savePreset, removePreset } =
    useSavedFilters<NotificationsFilters>('notifications');
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const notificationsQuery = useMyNotifications({
    pageSize,
    unread: readState === 'ALL' ? undefined : readState === 'UNREAD',
  });
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();
  const archiveNotification = useArchiveNotification();

  const notificationsData = notificationsQuery.data;
  const filtered = useMemo(() => {
    let notifications = notificationsData ?? [];
    if (search) {
      const needle = search.toLowerCase();
      notifications = notifications.filter(
        (notification) =>
          notification.title.toLowerCase().includes(needle) ||
          notification.message.toLowerCase().includes(needle),
      );
    }
    return [...notifications].sort((a, b) =>
      sort === 'newest'
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
  }, [notificationsData, search, sort]);
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

  return (
    <ContentContainer>
      <PageHeader
        title="Notifications"
        description="Updates about your courses and account."
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
        <SavedFiltersMenu
          presets={presets}
          currentFilters={filters}
          onSave={savePreset}
          onApply={(preset) => setFilters(preset)}
          onRemove={removePreset}
        />
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
        <>
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
                    notification.readAt === null
                      ? () => markRead.mutate([notification.id])
                      : undefined
                  }
                  onArchive={() => handleArchive(notification.id)}
                />
              </li>
            ))}
          </ul>
          {(notificationsData?.length ?? 0) === pageSize && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setPageSize((size) => size + PAGE_SIZE)}
                disabled={notificationsQuery.isFetching}
              >
                {notificationsQuery.isFetching && <Loader2 className="mr-2 size-4 animate-spin" />}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </ContentContainer>
  );
}
