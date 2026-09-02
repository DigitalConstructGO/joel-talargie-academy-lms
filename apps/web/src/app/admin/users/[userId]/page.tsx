'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  Ban,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserCircle,
  X,
} from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Can } from '@/components/auth/can';
import {
  useActivateUser,
  useArchiveUser,
  useAssignUserRole,
  useDeleteUserPermanently,
  useRemoveUserRole,
  useRestoreUser,
  useSuspendUser,
  useTriggerPasswordReset,
  useUser,
  useUserActivity,
  useUserRoles,
} from '@/features/users/hooks/use-users';
import { useRoles } from '@/features/roles/hooks/use-roles';
import type { ManagedUserStatus } from '@/features/users/types/user.types';
import { ROUTES } from '@/constants/routes';
import { formatDate, formatDateTime } from '@/lib/date';
import { extractErrorMessage } from '@/lib/api/api-error';
import { toast } from '@/lib/toast';

const STATUS_VARIANT: Record<ManagedUserStatus, NonNullable<BadgeProps['variant']>> = {
  PENDING_VERIFICATION: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'destructive',
  ARCHIVED: 'outline',
};

const STATUS_LABEL: Record<ManagedUserStatus, string> = {
  PENDING_VERIFICATION: 'Pending verification',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  ARCHIVED: 'Archived',
};

function ReasonField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2 py-2">
      <Label htmlFor="action-reason">Reason</Label>
      <Textarea
        id="action-reason"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Explain why (visible in the account's activity log)."
        rows={3}
      />
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const userQuery = useUser(userId);
  const activityQuery = useUserActivity(userId);
  const userRolesQuery = useUserRoles(userId);
  const rolesQuery = useRoles({ pageSize: 100 });
  const activate = useActivateUser();
  const suspend = useSuspendUser();
  const archive = useArchiveUser();
  const deletePermanently = useDeleteUserPermanently();
  const restore = useRestoreUser();
  const triggerReset = useTriggerPasswordReset();
  const assignRole = useAssignUserRole();
  const removeRole = useRemoveUserRole();
  const [suspendReason, setSuspendReason] = useState('');
  const [archiveReason, setArchiveReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  async function handleDeletePermanently() {
    try {
      await deletePermanently.mutateAsync({ userId, input: deleteReason });
      toast.success('User permanently deleted');
      if (typeof window !== 'undefined') {
        window.location.href = ROUTES.admin.users;
      }
    } catch (error) {
      toast.error('Could not permanently delete user', extractErrorMessage(error));
    }
  }

  if (userQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="User details" />
        <ErrorState onRetry={() => userQuery.refetch()} description="Unable to load this user." />
      </ContentContainer>
    );
  }

  const user = userQuery.data;

  async function handleActivate() {
    try {
      await activate.mutateAsync({ userId, input: undefined });
      toast.success('User activated');
    } catch {
      toast.error('Could not activate this user');
    }
  }

  async function handleSuspend() {
    try {
      await suspend.mutateAsync({ userId, input: suspendReason });
      toast.success('User suspended');
      setSuspendReason('');
    } catch {
      toast.error('Could not suspend this user');
    }
  }

  async function handleArchive() {
    try {
      await archive.mutateAsync({ userId, input: archiveReason });
      toast.success('User archived');
      setArchiveReason('');
    } catch {
      toast.error('Could not archive this user');
    }
  }

  async function handleRestore() {
    try {
      await restore.mutateAsync({ userId, input: undefined });
      toast.success('User restored');
    } catch {
      toast.error('Could not restore this user');
    }
  }

  async function handleTriggerReset() {
    try {
      await triggerReset.mutateAsync({ userId, input: undefined });
      toast.success('Password reset email sent');
    } catch {
      toast.error('Could not send the password reset email');
    }
  }

  async function handleAssignRole() {
    if (!selectedRoleId) return;
    try {
      await assignRole.mutateAsync({ userId, roleId: selectedRoleId });
      toast.success('Role assigned');
      setSelectedRoleId('');
    } catch (error) {
      // Surface the backend's actual reason (privilege-escalation block, role
      // already assigned, archived role, etc.) rather than a generic message -
      // these are meaningful, specific rules the admin needs to see.
      toast.error('Could not assign this role', extractErrorMessage(error));
    }
  }

  async function handleRemoveRole(roleId: string) {
    try {
      await removeRole.mutateAsync({ userId, roleId });
      toast.success('Role removed');
    } catch (error) {
      // e.g. "last Administrator cannot be removed" / "Student role is required"
      toast.error('Could not remove this role', extractErrorMessage(error));
    }
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Users', href: ROUTES.admin.users },
          { label: user?.fullName ?? 'User details' },
        ]}
      />
      <PageHeader
        title={user?.fullName ?? 'User details'}
        description={user?.email}
        actions={
          user && (
            <div className="flex flex-wrap gap-2">
              <Can permission="users.update">
                <Button asChild variant="outline" className="gap-2">
                  <Link href={ROUTES.admin.userEdit(userId)}>
                    <Pencil className="size-4" /> Edit profile
                  </Link>
                </Button>
              </Can>
              <Can permission="users.trigger_password_reset">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleTriggerReset}
                  disabled={triggerReset.isPending}
                >
                  {triggerReset.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <KeyRound className="size-4" />
                  )}
                  Send password reset
                </Button>
              </Can>
              {user.status !== 'ACTIVE' && user.status !== 'ARCHIVED' && (
                <Can permission="users.activate">
                  <LoadingButton
                    variant="outline"
                    className="gap-2"
                    onClick={handleActivate}
                    loading={activate.isPending}
                  >
                    <ShieldCheck className="size-4" /> Activate
                  </LoadingButton>
                </Can>
              )}
              {user.status === 'ACTIVE' && (
                <Can permission="users.suspend">
                  <ConfirmDialog
                    trigger={
                      <Button variant="outline" className="gap-2 text-warning hover:text-warning">
                        <Ban className="size-4" /> Suspend
                      </Button>
                    }
                    title="Suspend this user?"
                    description="They will lose access to the platform until reactivated."
                    confirmLabel="Suspend"
                    variant="destructive"
                    confirmDisabled={!suspendReason.trim()}
                    onConfirm={handleSuspend}
                  >
                    <ReasonField value={suspendReason} onChange={setSuspendReason} />
                  </ConfirmDialog>
                </Can>
              )}
              {user.status === 'ARCHIVED' ? (
                <Can permission="users.restore">
                  <LoadingButton
                    variant="outline"
                    className="gap-2"
                    onClick={handleRestore}
                    loading={restore.isPending}
                  >
                    <RotateCcw className="size-4" /> Restore
                  </LoadingButton>
                </Can>
              ) : (
                <Can permission="users.archive">
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="outline"
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" /> Archive
                      </Button>
                    }
                    title="Archive this user?"
                    description="This deactivates the account. It can be restored later."
                    confirmLabel="Archive"
                    variant="destructive"
                    confirmDisabled={!archiveReason.trim()}
                    onConfirm={handleArchive}
                  >
                    <ReasonField value={archiveReason} onChange={setArchiveReason} />
                  </ConfirmDialog>
                </Can>
              )}
              <Can permission="users.delete_permanent">
                <ConfirmDialog
                  trigger={
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="size-4" /> Delete Permanently
                    </Button>
                  }
                  title="Permanently delete this user?"
                  description="This action CANNOT be undone. The user's profile, enrollments, certificates, and progress will be erased. Total income and payment records will be preserved."
                  confirmLabel="Delete Permanently"
                  variant="destructive"
                  onConfirm={handleDeletePermanently}
                >
                  <ReasonField value={deleteReason} onChange={setDeleteReason} />
                </ConfirmDialog>
              </Can>
            </div>
          )
        }
      />

      {userQuery.isLoading || !user ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
              <Avatar className="size-16">
                <AvatarFallback>
                  <UserCircle className="size-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{user.fullName || 'Unnamed user'}</CardTitle>
                  <Badge variant={STATUS_VARIANT[user.status]}>{STATUS_LABEL[user.status]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Roles</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email verification</dt>
                  <dd className="font-medium text-foreground">
                    {user.emailVerified ? 'Verified' : 'Unverified'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sign-in method</dt>
                  <dd className="font-medium text-foreground">{user.provider}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium text-foreground">{user.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Joined</dt>
                  <dd className="font-medium text-foreground">{formatDate(user.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last login</dt>
                  <dd className="font-medium text-foreground">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                  </dd>
                </div>
              </dl>
              {user.bio && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Bio</p>
                    <p className="mt-1 text-sm text-foreground">{user.bio}</p>
                  </div>
                </>
              )}

              <Can permission="users.view_activity">
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    Recent activity
                  </p>
                  {activityQuery.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : activityQuery.data?.length ? (
                    <ul className="space-y-2 text-sm">
                      {activityQuery.data.map((entry) => (
                        <li key={entry.id} className="flex items-center justify-between gap-3">
                          <span className="text-foreground">{entry.action}</span>
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {formatDateTime(entry.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                  )}
                </div>
              </Can>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Enrollments</dt>
                  <dd className="font-medium text-foreground">{user.enrollmentCount}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Active enrollments</dt>
                  <dd className="font-medium text-foreground">{user.activeEnrollmentCount}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Completed courses</dt>
                  <dd className="font-medium text-foreground">{user.completedEnrollmentCount}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Payment attempts</dt>
                  <dd className="font-medium text-foreground">{user.paymentAttemptCount}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Certificates</dt>
                  <dd className="font-medium text-foreground">{user.certificateCount}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Active sessions</dt>
                  <dd className="font-medium text-foreground">{user.activeSessionCount}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userRolesQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-full" />
                  ))}
                </div>
              ) : userRolesQuery.isError ? (
                <ErrorState
                  onRetry={() => userRolesQuery.refetch()}
                  description="Unable to load roles."
                />
              ) : (
                <ul className="space-y-2">
                  {(userRolesQuery.data ?? []).map((role) => (
                    <li
                      key={role.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{role.name}</Badge>
                        {role.isSystem && (
                          <span className="text-xs text-muted-foreground">System</span>
                        )}
                      </div>
                      <Can permission="users.assign_roles">
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              disabled={removeRole.isPending}
                              aria-label={`Remove ${role.name} role`}
                            >
                              <X className="size-3.5" />
                            </Button>
                          }
                          title={`Remove the ${role.name} role?`}
                          description="The user immediately loses any access this role grants."
                          confirmLabel="Remove role"
                          variant="destructive"
                          onConfirm={() => handleRemoveRole(role.id)}
                        />
                      </Can>
                    </li>
                  ))}
                  {userRolesQuery.data?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No roles assigned.</p>
                  )}
                </ul>
              )}

              <Can permission="users.assign_roles">
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="assign-role">Assign a role</Label>
                  <div className="flex gap-2">
                    <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                      <SelectTrigger id="assign-role" className="flex-1">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {(rolesQuery.data?.items ?? [])
                          .filter(
                            (role) =>
                              !userRolesQuery.data?.some((assigned) => assigned.id === role.id),
                          )
                          .map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <LoadingButton
                      size="icon"
                      onClick={handleAssignRole}
                      loading={assignRole.isPending}
                      disabled={!selectedRoleId}
                      aria-label="Assign role"
                    >
                      <Plus className="size-4" />
                    </LoadingButton>
                  </div>
                </div>
              </Can>
            </CardContent>
          </Card>
        </div>
      )}
    </ContentContainer>
  );
}
