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
import { useLanguage } from '@/lib/i18n/language-provider';

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

function translateNotificationText(text: string, locale: string): string {
  if (locale !== 'am') return text;

  const NOTIFICATION_TEXT_MAP_AM: Record<string, string> = {
    'New Google sign-in': 'አዲስ የ Google መግቢያ',
    'A new sign-in to your academy account with Google was detected.':
      'በ Google መለያዎ አዲስ መግቢያ ተመዝግቧል።',
    'New login detected': 'አዲስ መግቢያ ተመዝግቧል',
    'Password changed successfully': 'የይለፍ ቃል በተሳካ ሁኔታ ተቀይሯል',
    'Certificate generated': 'ሰርተፊኬት ተዘጋጅቷል',
    'Payment submitted': 'ክፍያ ቀርቧል',
    'Payment approved': 'ክፍያ ተጸድቋል',
    'Payment declined': 'ክፍያ ውድቅ ተደርጓል',
    'Course enrollment confirmed': 'የኮርስ ምዝገባ ተረጋገጠ',
  };

  return NOTIFICATION_TEXT_MAP_AM[text] || text;
}

/** Reuses `features/notifications/` - `/me/notifications` is role-agnostic (no `@Roles()` guard), so this is the admin's own notification inbox, the exact same real data as the student Notifications page. */
export default function AdminNotificationsPage() {
  const { locale } = useLanguage();
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
    return [...(notificationsData ?? [])].sort((a, b) => {
      const aDate = String(a.createdAt ?? '');
      const bDate = String(b.createdAt ?? '');
      return sort === 'newest' ? bDate.localeCompare(aDate) : aDate.localeCompare(bDate);
    });
  }, [notificationsData, sort]);
  const hasUnread = (notificationsData ?? []).some((notification) => notification.readAt === null);
  const hasActiveFilters = readState !== 'ALL' || Boolean(search);

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, {
      onSuccess: () =>
        toast.success(
          locale === 'am' ? 'ሁሉም ማሳወቂያዎች እንደተነበቡ ተደርገዋል' : 'All notifications marked as read',
        ),
      onError: () =>
        toast.error(
          locale === 'am' ? 'ማሳወቂያዎችን እንደተነበበ ማድረግ አልተቻለም' : 'Could not mark notifications as read',
          locale === 'am' ? 'እባክዎ እንደገና ይሞክሩ።' : 'Please try again.',
        ),
    });
  }

  function handleArchive(id: string) {
    archiveNotification.mutate(id, {
      onSuccess: () => toast.success(locale === 'am' ? 'ማሳወቂያው ተቀምጧል' : 'Notification archived'),
      onError: () =>
        toast.error(
          locale === 'am' ? 'ማሳወቂያውን ማስቀመጥ አልተቻለም' : 'Could not archive that notification',
          locale === 'am' ? 'እባክዎ እንደገና ይሞክሩ።' : 'Please try again.',
        ),
    });
  }

  function handleMarkRead(id: string) {
    markRead.mutate([id], {
      onSuccess: () => toast.success(locale === 'am' ? 'እንደተነበበ ተደርጓል' : 'Marked as read'),
      onError: () =>
        toast.error(
          locale === 'am'
            ? 'ማሳወቂያውን እንደተነበበ ማድረግ አልተቻለም'
            : 'Could not mark that notification as read',
          locale === 'am' ? 'እባክዎ እንደገና ይሞክሩ።' : 'Please try again.',
        ),
    });
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: locale === 'am' ? 'ዳሽቦርድ' : 'Dashboard', href: ROUTES.admin.root },
          { label: locale === 'am' ? 'ኮሙኒኬሽን' : 'Communication', href: ROUTES.admin.communication },
          { label: locale === 'am' ? 'ማሳወቂያዎች' : 'Notifications' },
        ]}
      />
      <PageHeader
        title={locale === 'am' ? 'ማሳወቂያዎች' : 'Notifications'}
        description={
          locale === 'am' ? 'እንደ አስተዳዳሪ የእርስዎ ማሳወቂያዎች።' : 'Your notifications as an administrator.'
        }
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
              {locale === 'am' ? 'ሁሉንም እንደተነበበ ምልክት አድርግ' : 'Mark all as read'}
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
            <TabsTrigger value="ALL">{locale === 'am' ? 'ሁሉም' : 'All'}</TabsTrigger>
            <TabsTrigger value="UNREAD">{locale === 'am' ? 'ያልተነበቡ' : 'Unread'}</TabsTrigger>
            <TabsTrigger value="READ">{locale === 'am' ? 'የተነበቡ' : 'Read'}</TabsTrigger>
          </TabsList>
        </Tabs>
        <SearchBar
          placeholder={locale === 'am' ? 'ማሳወቂያዎችን ፈልግ...' : 'Search notifications...'}
          defaultValue={search ?? ''}
          onSearch={(value) => setFilter('search', value || undefined)}
          className="w-full sm:w-64"
          aria-label={locale === 'am' ? 'ማሳወቂያዎችን ፈልግ' : 'Search notifications'}
        />
      </div>

      <FilterBar>
        <Select
          value={sort}
          onValueChange={(value) => setFilter('sort', value as NotificationsFilters['sort'])}
        >
          <SelectTrigger className="w-40" aria-label={locale === 'am' ? 'ደርድር' : 'Sort'}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{locale === 'am' ? 'በቅድሚያ አዲስ' : 'Newest first'}</SelectItem>
            <SelectItem value="oldest">{locale === 'am' ? 'በቅድሚያ ቀዳሚ' : 'Oldest first'}</SelectItem>
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
                {locale === 'am' ? 'ማጣሪያዎችን አጽዳ' : 'Reset filters'}
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
                title={translateNotificationText(notification.title, locale)}
                description={
                  notification.message
                    ? translateNotificationText(notification.message, locale)
                    : undefined
                }
                timestamp={formatRelativeTime(notification.createdAt, locale)}
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
