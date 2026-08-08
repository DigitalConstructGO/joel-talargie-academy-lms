'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Can } from '@/components/auth/can';
import { useArchiveRole, useRole } from '@/features/roles/hooks/use-roles';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/lib/date';
import { toast } from '@/lib/toast';

export default function AdminRoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const router = useRouter();
  const roleQuery = useRole(roleId);
  const archiveRole = useArchiveRole();
  const role = roleQuery.data;

  async function handleArchive() {
    try {
      await archiveRole.mutateAsync(roleId);
      toast.success('Role archived');
      router.push(ROUTES.admin.systemRoles);
    } catch {
      toast.error('Could not archive this role');
    }
  }

  if (roleQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Role details" />
        <ErrorState onRetry={() => roleQuery.refetch()} description="Unable to load this role." />
      </ContentContainer>
    );
  }

  const groups = role
    ? Object.entries(
        role.permissions.reduce<Record<string, typeof role.permissions>>((acc, permission) => {
          (acc[permission.module] ??= []).push(permission);
          return acc;
        }, {}),
      )
    : [];

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Roles', href: ROUTES.admin.systemRoles },
          { label: role?.name ?? 'Role details' },
        ]}
      />
      <PageHeader
        title={role?.name ?? 'Role details'}
        description={role?.description ?? undefined}
        actions={
          role &&
          !role.isSystem && (
            <div className="flex gap-2">
              <Can permission="roles.update">
                <Button asChild variant="outline" className="gap-2">
                  <Link href={ROUTES.admin.systemRoleEdit(roleId)}>
                    <Pencil className="size-4" /> Edit
                  </Link>
                </Button>
              </Can>
              <Can permission="roles.archive">
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" /> Archive
                    </Button>
                  }
                  title="Archive this role?"
                  description="Users assigned this role keep it, but it can no longer be assigned to new users."
                  confirmLabel="Archive"
                  variant="destructive"
                  onConfirm={handleArchive}
                />
              </Can>
            </div>
          )
        }
      />

      {roleQuery.isLoading || !role ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Code</p>
                <p className="font-medium text-foreground">{role.code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scope</p>
                <Badge variant={role.isSystem ? 'secondary' : 'outline'}>
                  {role.isSystem ? 'System' : 'Custom'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Users assigned</p>
                <p className="font-medium text-foreground">{role.userCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium text-foreground">{formatDate(role.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {role.isSystem && (
            <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              System roles are protected and cannot be edited or archived.
            </p>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4" /> Permissions ({role.permissionCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No permissions assigned.</p>
              ) : (
                groups.map(([module, permissions]) => (
                  <div key={module}>
                    <p className="mb-2 text-xs font-semibold capitalize text-muted-foreground">
                      {module}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {permissions.map((permission) => (
                        <Badge key={permission.id} variant="secondary">
                          {permission.code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </ContentContainer>
  );
}
