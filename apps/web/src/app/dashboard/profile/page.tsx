'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Award,
  Bell,
  Camera,
  CreditCard,
  KeyRound,
  Loader2,
  Trash2,
  UserCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState } from '@/components/common/error-state';
import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { CourseProgressCard } from '@/components/dashboard/course-progress-card';
import { NotificationCard } from '@/components/dashboard/notification-card';
import { EmptyState } from '@/components/common/empty-state';
import { Reveal } from '@/components/common/reveal';
import { ProfileSkeleton } from '@/components/dashboard/skeletons/profile-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyEnrollments } from '@/features/enrollments/hooks/use-enrollments';
import { estimateLessonProgress } from '@/features/enrollments/utils/estimate-lesson-progress';
import { useCourses } from '@/features/catalog/hooks/use-courses';
import { useProfile, useUpdateProfile } from '@/features/account/hooks/use-account';
import {
  useAvatarImage,
  useDeleteAvatar,
  useUploadAvatar,
} from '@/features/account/hooks/use-avatar';
import { useMyCertificates } from '@/features/certificates/hooks/use-certificates';
import { CertificateCard } from '@/features/certificates/components/certificate-card';
import { useMyNotifications } from '@/features/notifications/hooks/use-notifications';
import { formatRelativeTime } from '@/lib/format';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/constants/routes';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const profileFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(160),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  bio: z.string().trim().max(1000).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const enrollmentsQuery = useMyEnrollments({ pageSize: 100 });
  const coursesQuery = useCourses({ pageSize: 100 });
  const certificatesQuery = useMyCertificates({ pageSize: 100 });
  const activityQuery = useMyNotifications({ pageSize: 5 });

  const profile = profileQuery.data;
  const avatar = useAvatarImage(profile?.id);
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const coursesBySlug = new Map(
    (coursesQuery.data?.items ?? []).map((course) => [course.slug, course]),
  );
  const enrollments = enrollmentsQuery.data?.items ?? [];
  const completed = enrollments.filter((enrollment) => enrollment.status === 'COMPLETED');
  const inProgress = enrollments.filter((enrollment) => enrollment.status === 'IN_PROGRESS');
  const certificates = certificatesQuery.data ?? [];
  const certificatesEarned = certificates.filter(
    (certificate) => certificate.status === 'GENERATED',
  ).length;
  const isLoading = enrollmentsQuery.isLoading || coursesQuery.isLoading || profileQuery.isLoading;
  const hasCoreError = profileQuery.isError || enrollmentsQuery.isError || coursesQuery.isError;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { fullName: '', phone: '', bio: '' },
  });

  useEffect(() => {
    if (profile) {
      reset({ fullName: profile.fullName, phone: profile.phone ?? '', bio: profile.bio ?? '' });
    }
  }, [profile, reset]);

  async function onSubmit(values: ProfileFormValues) {
    try {
      await updateProfile.mutateAsync({
        fullName: values.fullName.trim(),
        phone: values.phone?.trim() || undefined,
        bio: values.bio?.trim() || undefined,
      });
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update your profile', 'Please try again.');
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error('Unsupported file type', 'Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image is too large', 'Please choose an image under 5 MB.');
      return;
    }
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success('Profile photo updated');
    } catch {
      toast.error('Could not upload your photo', 'Please try again.');
    }
  }

  async function handleAvatarRemove() {
    try {
      await deleteAvatar.mutateAsync();
      toast.success('Profile photo removed');
    } catch {
      toast.error('Could not remove your photo', 'Please try again.');
    }
  }

  const completionChecks = [
    Boolean(profile?.fullName),
    Boolean(profile?.phone),
    Boolean(profile?.bio),
    Boolean(avatar.url),
  ];
  const completionPercent = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100,
  );

  if (hasCoreError) {
    return (
      <ContentContainer>
        <PageHeader title="Profile" description="Your personal information." />
        <ErrorState
          description="Unable to load your profile."
          onRetry={() => {
            void profileQuery.refetch();
            void enrollmentsQuery.refetch();
            void coursesQuery.refetch();
          }}
        />
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <PageHeader title="Profile" description="Your personal information." />

      {isLoading ? (
        <ProfileSkeleton className="h-40" />
      ) : (
        <Reveal>
          <Card className="overflow-hidden">
            <div className="h-24 bg-linear-to-br from-auth-gradient-from via-auth-gradient-via to-auth-gradient-to sm:h-32" />
            <CardContent className="flex flex-col gap-4 pt-0 sm:flex-row sm:items-end sm:justify-between">
              <div className="-mt-10 flex flex-col items-center gap-3 sm:flex-row sm:items-end">
                <div className="relative">
                  <Avatar className="size-20 border-4 border-card shadow-lg">
                    <AvatarImage src={avatar.url ?? undefined} alt="" />
                    <AvatarFallback>
                      <UserCircle className="size-9" />
                    </AvatarFallback>
                  </Avatar>
                  {avatar.isLoading && <Skeleton className="absolute inset-0 rounded-full" />}
                </div>
                <div className="pb-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h2 className="text-lg font-bold text-foreground">
                      {profile?.fullName || 'Your account'}
                    </h2>
                    <Badge variant="secondary">Student</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 sm:items-end">
                <div className="flex w-40 items-center gap-2">
                  <Progress value={completionPercent} />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {completionPercent}%
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatar.isPending}
                  >
                    {uploadAvatar.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Camera className="size-3.5" />
                    )}
                    Change photo
                  </Button>
                  {avatar.url && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="gap-2 text-muted-foreground hover:text-destructive"
                      onClick={handleAvatarRemove}
                      disabled={deleteAvatar.isPending}
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      )}

      <Reveal delaySeconds={0.05}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal information</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
                  <Input id="email" value={profile?.email ?? ''} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" {...register('phone')} placeholder="+251 9XX XXX XXX" />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bio">Biography (optional)</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    {...register('bio')}
                    placeholder="Tell us a bit about yourself"
                  />
                  {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
                    {updateProfile.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Save changes
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal delaySeconds={0.1} className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : (
            <SummaryCard
              title="Learning statistics"
              rows={[
                { label: 'Enrolled courses', value: enrollments.length },
                { label: 'In progress', value: inProgress.length },
                { label: 'Completed courses', value: completed.length },
                { label: 'Certificates earned', value: certificatesEarned },
              ]}
            />
          )}
        </Reveal>

        <Reveal delaySeconds={0.15}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href={ROUTES.dashboard.security}>
                  <KeyRound className="size-4" />
                  Security
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href={ROUTES.dashboard.settings}>
                  <Bell className="size-4" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link href={ROUTES.dashboard.payments}>
                  <CreditCard className="size-4" />
                  Payments
                </Link>
              </Button>
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <Reveal delaySeconds={0.1}>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Achievements &amp; certificates</CardTitle>
            {certificates.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.dashboard.certificates}>View all</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {certificatesQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : certificatesQuery.isError ? (
              <ErrorState
                className="py-8"
                description="Unable to load your certificates."
                onRetry={() => certificatesQuery.refetch()}
              />
            ) : certificates.length === 0 ? (
              <EmptyState
                icon={Award}
                title="No certificates yet"
                description="Complete a certificate-eligible course to earn your first certificate."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {certificates.slice(0, 3).map((certificate) => (
                  <CertificateCard
                    key={certificate.id}
                    certificate={certificate}
                    href={ROUTES.dashboard.certificateDetail(certificate.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal delaySeconds={0.1}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Current courses</CardTitle>
              {inProgress.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={ROUTES.dashboard.courses}>View all</Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-xl" />
                ))
              ) : inProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">No courses in progress right now.</p>
              ) : (
                inProgress
                  .slice(0, 3)
                  .map((enrollment) => (
                    <CourseProgressCard
                      key={enrollment.id}
                      href={ROUTES.dashboard.learn(enrollment.id)}
                      category={enrollment.categoryName}
                      categorySlug={enrollment.categorySlug}
                      title={enrollment.courseTitle}
                      progressPercent={enrollment.progressPercentage}
                      {...estimateLessonProgress(
                        enrollment.progressPercentage,
                        coursesBySlug.get(enrollment.courseSlug)?.lessonCount,
                      )}
                    />
                  ))
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delaySeconds={0.15}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Completed courses</CardTitle>
              {completed.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={ROUTES.dashboard.courses}>View all</Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-xl" />
                ))
              ) : completed.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Completed courses will show up here.
                </p>
              ) : (
                completed
                  .slice(0, 3)
                  .map((enrollment) => (
                    <CourseProgressCard
                      key={enrollment.id}
                      href={ROUTES.dashboard.learn(enrollment.id)}
                      category={enrollment.categoryName}
                      categorySlug={enrollment.categorySlug}
                      title={enrollment.courseTitle}
                      progressPercent={enrollment.progressPercentage}
                    />
                  ))
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <Reveal delaySeconds={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : activityQuery.isError ? (
              <ErrorState
                className="py-8"
                description="Unable to load recent activity."
                onRetry={() => activityQuery.refetch()}
              />
            ) : (activityQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              <ul className="flex flex-col gap-1 rounded-xl border border-border bg-card p-2">
                {(activityQuery.data ?? []).map((item) => (
                  <li key={item.id}>
                    <NotificationCard
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
      </Reveal>
    </ContentContainer>
  );
}
