'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PermissionPicker } from '@/features/roles/components/permission-picker';
import { useCreateRole } from '@/features/roles/hooks/use-roles';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/lib/toast';

const CODE_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

const formSchema = z.object({
  name: z.string().trim().min(2, 'Enter a role name.').max(80),
  code: z
    .string()
    .trim()
    .max(64)
    .regex(CODE_PATTERN, 'Use SCREAMING_SNAKE_CASE, e.g. CONTENT_MANAGER.'),
  description: z.string().trim().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminRoleCreatePage() {
  const router = useRouter();
  const createRole = useCreateRole();
  const [permissionIds, setPermissionIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', code: '', description: '' },
  });

  async function onSubmit(values: FormValues) {
    try {
      const role = await createRole.mutateAsync({
        name: values.name.trim(),
        code: values.code.trim(),
        description: values.description?.trim() || undefined,
        permissionIds,
      });
      toast.success('Role created');
      router.push(ROUTES.admin.systemRoleDetail(role.id));
    } catch {
      toast.error(
        'Could not create this role',
        'Check the role code is unique and you hold every permission you selected.',
      );
    }
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Roles', href: ROUTES.admin.systemRoles },
          { label: 'New role' },
        ]}
      />
      <PageHeader title="New role" description="Create a role and assign its permissions." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} placeholder="Content Manager" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" {...register('code')} placeholder="CONTENT_MANAGER" />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
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
          <Button type="submit" disabled={createRole.isPending}>
            {createRole.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create role
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.systemRoles)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ContentContainer>
  );
}
