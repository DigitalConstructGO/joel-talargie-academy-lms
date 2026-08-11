'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { DateRange } from 'react-day-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bell,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Laptop,
  LogOut,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchBar } from '@/components/common/search-bar';
import { FilterBar } from '@/components/dashboard/filters/filter-bar';
import { DateRangeFilter } from '@/components/dashboard/filters/date-range-filter';
import { DashboardApiErrorState } from '@/components/dashboard/error-states';
import {
  NoNotificationsEmptyState,
  NoSearchResultsEmptyState,
} from '@/components/dashboard/empty-states';
import { NotificationCard } from '@/components/dashboard/notification-card';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useLogout } from '@/hooks/use-logout';
import {
  useProfile,
  useRevokeAllSessions,
  useRevokeSession,
  useSessions,
} from '@/features/account/hooks/use-account';
import { useMyNotifications } from '@/features/notifications/hooks/use-notifications';
import { authClient } from '@/lib/api/auth-client';
import { extractErrorMessage, extractFieldErrors } from '@/lib/api/api-error';
import { formatRelativeTime } from '@/lib/format';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';

const strongPassword = z
  .string()
  .min(8)
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[a-z]/, 'Must include a lowercase letter')
  .regex(/\d/, 'Must include a number')
  .regex(/[^A-Za-z\d]/, 'Must include a symbol');

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function ChangePasswordCard() {
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await authClient.post('/auth/change-password', values);
      toast.success('Password updated', 'Use your new password next time you sign in.');
      form.reset();
    } catch (error) {
      const fieldErrors = extractFieldErrors(error);
      if (fieldErrors.length > 0) {
        for (const { field, message } of fieldErrors) {
          form.setError(field as keyof ChangePasswordValues, { message });
        }
      } else {
        form.setError('currentPassword', {
          message: extractErrorMessage(error, 'Could not change your password. Please try again.'),
        });
      }
    }
  });

  return (
    <Card id="change-password" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="text-base">Change password</CardTitle>
        <CardDescription>Use a strong password you don&apos;t use anywhere else.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" {...form.register('currentPassword')} />
            {form.formState.errors.currentPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" type="password" {...form.register('newPassword')} />
              {form.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" type="password" {...form.register('confirmPassword')} />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
          <Button type="submit" className="w-fit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SecurityScoreCard() {
  const profileQuery = useProfile();
  const sessionsQuery = useSessions();
  const profile = profileQuery.data;
  const sessionCount = sessionsQuery.data?.length ?? 0;
  const isLoading = profileQuery.isLoading || sessionsQuery.isLoading;

  const checks = [
    { label: 'Email verified', met: Boolean(profile?.emailVerified) },
    { label: 'Account in good standing', met: profile?.status === 'ACTIVE' },
    { label: 'Few active sessions', met: sessionCount > 0 && sessionCount <= 3 },
    { label: 'Two-factor authentication', met: false },
  ];
  const metCount = checks.filter((check) => check.met).length;
  const score = Math.round((metCount / checks.length) * 100);
  const scoreColor =
    score >= 75 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Security score</CardTitle>
        <CardDescription>Computed from real signals on your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <>
            <p className={cn('text-center text-4xl font-bold', scoreColor)}>{score}%</p>
            <ul className="space-y-2">
              {checks.map((check) => (
                <li key={check.label} className="flex items-center gap-2 text-sm">
                  {check.met ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : (
                    <XCircle className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={check.met ? 'text-foreground' : 'text-muted-foreground'}>
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionsCard() {
  const sessionsQuery = useSessions();
  const revokeAllSessions = useRevokeAllSessions();
  const otherSessionsCount = (sessionsQuery.data ?? []).filter(
    (session) => !session.currentSession,
  ).length;

  function handleRevokeAllOthers() {
    revokeAllSessions.mutate(false, {
      onSuccess: (result) =>
        toast.success(
          `Signed out of ${result.revokedSessions} other session${result.revokedSessions === 1 ? '' : 's'}`,
        ),
      onError: () => toast.error('Could not sign out of other sessions', 'Please try again.'),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" className="w-full justify-start gap-2" asChild>
          <a href="#change-password">
            <KeyRound className="size-4" />
            Change password
          </a>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleRevokeAllOthers}
          disabled={otherSessionsCount === 0 || revokeAllSessions.isPending}
        >
          <LogOut className="size-4" />
          Sign out of other sessions
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2" asChild>
          <Link href={ROUTES.dashboard.payments}>
            <CreditCard className="size-4" />
            View payments
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2" asChild>
          <Link href={ROUTES.dashboard.settings}>
            <Bell className="size-4" />
            Notification settings
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function DevicesCard() {
  const handleLogout = useLogout();
  const sessionsQuery = useSessions();
  const revokeSession = useRevokeSession();

  const sessions = sessionsQuery.data ?? [];

  async function handleRevoke(sessionId: string, isCurrent: boolean) {
    if (isCurrent) {
      await handleLogout();
      return;
    }
    revokeSession.mutate(sessionId, {
      onSuccess: () => toast.success('Session revoked'),
      onError: () => toast.error('Could not revoke that session', 'Please try again.'),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Devices</CardTitle>
        <CardDescription>Devices currently signed in to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {sessionsQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : sessionsQuery.isError ? (
          <DashboardApiErrorState onRetry={() => sessionsQuery.refetch()} />
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions found.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-3 rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Laptop className="size-5" aria-hidden="true" />
                  </span>
                  {session.currentSession && <Badge variant="secondary">This device</Badge>}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {session.deviceName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.ipAddress ?? 'Unknown IP'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last active {formatRelativeTime(session.lastUsedAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit"
                  onClick={() => handleRevoke(session.id, session.currentSession)}
                  disabled={revokeSession.isPending}
                >
                  {session.currentSession ? 'Sign out' : 'Revoke'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TwoFactorCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Two-factor authentication</CardTitle>
        <CardDescription>Add an extra layer of security to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Authenticator app</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </div>
          <Switch disabled />
        </div>
      </CardContent>
    </Card>
  );
}

function RecoveryOptionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recovery options</CardTitle>
        <CardDescription>Ways to regain access if you&apos;re locked out.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Email reset link</p>
            <p className="text-xs text-muted-foreground">
              Available now via &quot;Forgot password&quot;
            </p>
          </div>
          <Badge variant="success">Active</Badge>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border p-4 opacity-60">
          <div>
            <p className="text-sm font-medium text-foreground">Backup codes</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
          <Badge variant="warning">Coming soon</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivityFilters {
  [key: string]: string | undefined;
  search: string | undefined;
  sort: 'newest' | 'oldest';
  from: string | undefined;
  to: string | undefined;
}

const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  search: undefined,
  sort: 'newest',
  from: undefined,
  to: undefined,
};

function ActivityLogCard() {
  const { filters, setFilter, setFilters } = useQueryFilters<ActivityFilters>({
    defaults: DEFAULT_ACTIVITY_FILTERS,
  });
  const { search, sort, from, to } = filters;

  const notificationsQuery = useMyNotifications({ pageSize: 50, search: search || undefined });

  // Search is applied backend-side (see useMyNotifications above). Date
  // range has no backend param yet, so it - like sort order - is still
  // applied client-side over the (already search-filtered) fetched page.
  const activity = useMemo(() => {
    let items = notificationsQuery.data ?? [];
    if (from) items = items.filter((item) => item.createdAt >= from);
    if (to) items = items.filter((item) => item.createdAt <= `${to}T23:59:59.999Z`);
    return [...items].sort((a, b) =>
      sort === 'newest'
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
  }, [notificationsQuery.data, sort, from, to]);

  const dateRange: DateRange | undefined =
    from || to
      ? { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined }
      : undefined;
  const hasActiveFilters = Boolean(search) || Boolean(from) || Boolean(to);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent account activity</CardTitle>
        <CardDescription>
          Derived from your notifications feed - login alerts, payments and enrollment updates. Not
          a full audit log. Date range and sort only cover your 50 most recent items.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FilterBar>
          <SearchBar
            placeholder="Search activity..."
            defaultValue={search ?? ''}
            onSearch={(value) => setFilter('search', value || undefined)}
            className="w-full sm:w-64"
            aria-label="Search activity"
          />
          <DateRangeFilter
            value={dateRange}
            onChange={(range) =>
              setFilters({
                from: range?.from ? range.from.toISOString().slice(0, 10) : undefined,
                to: range?.to ? range.to.toISOString().slice(0, 10) : undefined,
              })
            }
          />
          <Select
            value={sort}
            onValueChange={(value) => setFilter('sort', value as ActivityFilters['sort'])}
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
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : notificationsQuery.isError ? (
          <DashboardApiErrorState onRetry={() => notificationsQuery.refetch()} />
        ) : activity.length === 0 ? (
          hasActiveFilters ? (
            <NoSearchResultsEmptyState />
          ) : (
            <NoNotificationsEmptyState />
          )
        ) : (
          <ul className="flex flex-col gap-1 rounded-xl border border-border bg-card p-2">
            {activity.map((item) => (
              <li key={item.id}>
                <NotificationCard
                  icon={Bell}
                  title={item.title}
                  description={item.message}
                  timestamp={formatRelativeTime(item.createdAt)}
                  read
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentSecurityPage() {
  return (
    <ContentContainer>
      <PageHeader
        title="Security"
        description="Manage your password and account security."
        actions={
          <KeyRound className="hidden size-5 text-muted-foreground sm:block" aria-hidden="true" />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-6">
          <ChangePasswordCard />
          <DevicesCard />
          <ActivityLogCard />
        </div>
        <div className="space-y-6">
          <SecurityScoreCard />
          <QuickActionsCard />
          <TwoFactorCard />
          <RecoveryOptionsCard />
        </div>
      </div>
    </ContentContainer>
  );
}
