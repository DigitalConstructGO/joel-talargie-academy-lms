'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { useUpdateUserProfile, useUser } from '@/features/users/hooks/use-users';
import { usePermissions } from '@/hooks/use-permissions';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/lib/toast';

const formSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter a full name.').max(160),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  bio: z.string().trim().max(1000).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminUserEditPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const userQuery = useUser(userId);
  const updateProfile = useUpdateUserProfile();
  const user = userQuery.data;
  const { can } = usePermissions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: '', phone: '', bio: '' },
  });

  useEffect(() => {
    if (user) reset({ fullName: user.fullName, phone: user.phone ?? '', bio: user.bio ?? '' });
  }, [user, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await updateProfile.mutateAsync({
        userId,
        input: {
          fullName: values.fullName.trim(),
          phone: values.phone?.trim() || undefined,
          bio: values.bio?.trim() || undefined,
        },
      });
      toast.success('Profile updated');
      router.push(ROUTES.admin.userDetail(userId));
    } catch {
      toast.error('Could not update this profile', 'Please try again.');
    }
  }

  if (!can('users.update')) {
    return (
      <ContentContainer>
        <StatusPage
          icon={ShieldAlert}
          code="403"
          title="Access restricted"
          description="You don't have permission to edit user profiles."
          action={
            <Button asChild>
              <Link href={ROUTES.admin.userDetail(userId)}>Back to user</Link>
            </Button>
          }
        />
      </ContentContainer>
    );
  }

  if (userQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Edit user" />
        <ErrorState onRetry={() => userQuery.refetch()} description="Unable to load this user." />
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Users', href: ROUTES.admin.users },
          {
            label: user?.fullName ?? 'User',
            href: user ? ROUTES.admin.userDetail(userId) : undefined,
          },
          { label: 'Edit' },
        ]}
      />
      <PageHeader title="Edit profile" description={user?.email} />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          {userQuery.isLoading || !user ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" {...register('fullName')} />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" {...register('phone')} placeholder="+251 9XX XXX XXX" />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bio">Biography (optional)</Label>
                <Textarea id="bio" rows={3} {...register('bio')} />
                {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(ROUTES.admin.userDetail(userId))}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </ContentContainer>
  );
}
