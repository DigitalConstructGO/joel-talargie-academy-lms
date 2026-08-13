'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, ShieldAlert } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { StatusPage } from '@/components/common/status-page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PermissionPicker } from '@/features/roles/components/permission-picker';
import {
  useReplaceRolePermissions,
  useRole,
  useUpdateRole,
} from '@/features/roles/hooks/use-roles';
import { usePermissions } from '@/hooks/use-permissions';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/lib/toast';

const formSchema = z.object({
  name: z.string().trim().min(2, 'Enter a role name.').max(80),
  description: z.string().trim().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminRoleEditPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const router = useRouter();
  const roleQuery = useRole(roleId);
  const updateRole = useUpdateRole();
  const replacePermissions = useReplaceRolePermissions();
  const role = roleQuery.data;
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const initialized = useRef(false);
  const { can } = usePermissions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (role && !initialized.current) {
      initialized.current = true;
      reset({ name: role.name, description: role.description ?? '' });
      setPermissionIds(role.permissions.map((permission) => permission.id));
    }
  }, [role, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await updateRole.mutateAsync({
        roleId,
        input: { name: values.name.trim(), description: values.description?.trim() || undefined },
      });
    } catch {
      toast.error('Could not update this role');
      return;
    }

    const currentIds = role?.permissions
      .map((p) => p.id)
      .sort()
      .join(',');
    if (permissionIds.slice().sort().join(',') !== currentIds) {
      try {
        await replacePermissions.mutateAsync({ roleId, permissionIds });
      } catch {
        toast.error(
          'Could not update permissions',
          'Check you hold every permission you selected.',
        );
        return;
      }
    }

    toast.success('Role updated');
    router.push(ROUTES.admin.systemRoleDetail(roleId));
  }

  if (!can('roles.update')) {
    return (
      <ContentContainer>
        <StatusPage
          icon={ShieldAlert}
          code="403"
          title="Access restricted"
          description="You don't have permission to edit roles."
          action={
            <Button asChild>
              <Link href={ROUTES.admin.systemRoles}>Back to roles</Link>
            </Button>
          }
        />
      </ContentContainer>
    );
  }

  if (roleQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Edit role" />
        <ErrorState onRetry={() => roleQuery.refetch()} description="Unable to load this role." />
      </ContentContainer>
    );
  }

  if (role?.isSystem) {
    return (
      <ContentContainer>
        <PageHeader title="Edit role" description={role.name} />
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
          System roles are protected and cannot be edited.{' '}
          <button
            type="button"
            className="underline"
            onClick={() => router.push(ROUTES.admin.systemRoleDetail(roleId))}
          >
            Back to role details
          </button>
        </p>
      </ContentContainer>
    );
  }

  const isSaving = updateRole.isPending || replacePermissions.isPending;

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Roles', href: ROUTES.admin.systemRoles },
          {
            label: role?.name ?? 'Role',
            href: role ? ROUTES.admin.systemRoleDetail(roleId) : undefined,
          },
          { label: 'Edit' },
        ]}
      />
      <PageHeader title="Edit role" description={role?.name} />

      {roleQuery.isLoading || !role ? (
        <Skeleton className="h-96" />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" value={role.code} readOnly disabled />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea id="description" rows={2} {...register('description')} />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label className="text-base">Permissions</Label>
                <p className="text-sm text-muted-foreground">
                  You can only assign permissions you personally hold.
                </p>
              </div>
              <PermissionPicker selected={permissionIds} onChange={setPermissionIds} />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(ROUTES.admin.systemRoleDetail(roleId))}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </ContentContainer>
  );
}
