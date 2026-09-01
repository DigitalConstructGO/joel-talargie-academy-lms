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

import {
  useLanguage,
  translateRoleName,
  translateRoleDescription,
  translateModuleName,
} from '@/lib/i18n/language-provider';

export default function AdminRoleDetailPage() {
  const { locale } = useLanguage();
  const { roleId } = useParams<{ roleId: string }>();
  const router = useRouter();
  const roleQuery = useRole(roleId);
  const archiveRole = useArchiveRole();
  const role = roleQuery.data;

  async function handleArchive() {
    try {
      await archiveRole.mutateAsync(roleId);
      toast.success(locale === 'am' ? 'ሚናው ተቀምጧል' : 'Role archived');
      router.push(ROUTES.admin.systemRoles);
    } catch {
      toast.error(locale === 'am' ? 'ሚናውን ማስቀመጥ አልተቻለም' : 'Could not archive this role');
    }
  }

  if (roleQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title={locale === 'am' ? 'የሚና ዝርዝር' : 'Role details'} />
        <ErrorState
          onRetry={() => roleQuery.refetch()}
          description={locale === 'am' ? 'ይህንን ሚና መጫን አልተቻለም።' : 'Unable to load this role.'}
        />
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
          { label: locale === 'am' ? 'ዳሽቦርድ' : 'Dashboard', href: ROUTES.admin.root },
          { label: locale === 'am' ? 'ሚናዎች' : 'Roles', href: ROUTES.admin.systemRoles },
          {
            label: role
              ? translateRoleName(role.name, locale)
              : locale === 'am'
                ? 'የሚና ዝርዝር'
                : 'Role details',
          },
        ]}
      />
      <PageHeader
        title={
          role
            ? translateRoleName(role.name, locale)
            : locale === 'am'
              ? 'የሚና ዝርዝር'
              : 'Role details'
        }
        description={role ? translateRoleDescription(role.description, locale) : undefined}
        actions={
          role &&
          !role.isSystem && (
            <div className="flex gap-2">
              <Can permission="roles.update">
                <Button asChild variant="outline" className="gap-2">
                  <Link href={ROUTES.admin.systemRoleEdit(roleId)}>
                    <Pencil className="size-4" /> {locale === 'am' ? 'አስተካክል' : 'Edit'}
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
                      <Trash2 className="size-4" /> {locale === 'am' ? 'አስቀምጥ' : 'Archive'}
                    </Button>
                  }
                  title={locale === 'am' ? 'ይህንን ሚና ማስቀመጥ ይፈልጋሉ?' : 'Archive this role?'}
                  description={
                    locale === 'am'
                      ? 'ይህ ሚና የተሰጣቸው ተጠቃሚዎች ይይዙታል፣ ነገር ግን ከአሁን በኋላ ለአዳዲስ ተማሪዎች ሊሰጥ አይችልም።'
                      : 'Users assigned this role keep it, but it can no longer be assigned to new users.'
                  }
                  confirmLabel={locale === 'am' ? 'አስቀምጥ' : 'Archive'}
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
                <p className="text-xs text-muted-foreground">{locale === 'am' ? 'ኮድ' : 'Code'}</p>
                <p className="font-medium text-foreground">{role.code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{locale === 'am' ? 'ወሰን' : 'Scope'}</p>
                <Badge variant={role.isSystem ? 'secondary' : 'outline'}>
                  {role.isSystem
                    ? locale === 'am'
                      ? 'ሲስተም'
                      : 'System'
                    : locale === 'am'
                      ? 'የተበጀ'
                      : 'Custom'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {locale === 'am' ? 'የተመደቡ ተጠቃሚዎች' : 'Users assigned'}
                </p>
                <p className="font-medium text-foreground">{role.userCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {locale === 'am' ? 'የተፈጠረበት' : 'Created'}
                </p>
                <p className="font-medium text-foreground">{formatDate(role.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {role.isSystem && (
            <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {locale === 'am'
                ? 'የሲስተም ሚናዎች የተጠበቁ ናቸው፣ ማስተካከል ወይም ማስቀመጥ አይቻልም።'
                : 'System roles are protected and cannot be edited or archived.'}
            </p>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4" />{' '}
                {locale === 'am'
                  ? `ፈቃዶች (${role.permissionCount})`
                  : `Permissions (${role.permissionCount})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === 'am' ? 'ምንም የተሰጠ ፈቃድ የለም።' : 'No permissions assigned.'}
                </p>
              ) : (
                groups.map(([module, permissions]) => (
                  <div key={module}>
                    <p className="mb-2 text-xs font-semibold capitalize text-muted-foreground">
                      {translateModuleName(module, locale)}
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
