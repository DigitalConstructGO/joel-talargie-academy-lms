'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Laptop } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardApiErrorState } from '@/components/dashboard/error-states';
import { useLogout } from '@/hooks/use-logout';
import { useRevokeSession, useSessions } from '@/features/account/hooks/use-account';
import { authClient } from '@/lib/api/auth-client';
import { formatRelativeTime } from '@/lib/format';
import { toast } from '@/lib/toast';

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

/** Reuses `features/account/` sessions - `/me/sessions` is role-agnostic, same real data as the student Security page. */
export default function AdminSecurityPage() {
  const handleLogout = useLogout();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const sessionsQuery = useSessions();
  const revokeSession = useRevokeSession();
  const sessions = sessionsQuery.data ?? [];

  const submit = form.handleSubmit(async (values) => {
    try {
      await authClient.post('/auth/change-password', values);
      toast.success('Password updated', 'Use your new password next time you sign in.');
      form.reset();
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Could not change your password. Please try again.';
      form.setError('currentPassword', { message });
    }
  });

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
    <ContentContainer>
      <PageHeader
        title="Security"
        description="Manage your password and account security."
        actions={
          <KeyRound className="hidden size-5 text-muted-foreground sm:block" aria-hidden="true" />
        }
      />

      <Card>
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
    </ContentContainer>
  );
}
