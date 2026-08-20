'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Award,
  BookOpen,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  Trash2,
  User,
  UserCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState } from '@/components/common/error-state';
import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { CourseProgressCard } from '@/components/dashboard/course-progress-card';
import { EmptyState } from '@/components/common/empty-state';
import { Reveal } from '@/components/common/reveal';
import { ProfileSkeleton } from '@/components/dashboard/skeletons/profile-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
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
import { authClient } from '@/lib/api/auth-client';
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

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[a-z]/, 'Must include a lowercase letter')
  .regex(/\d/, 'Must include a number')
  .regex(/[^A-Za-z\d]/, 'Must include a symbol');

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'U';
}

export default function ProfilePage() {
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const profile = profileQuery.data;
  const isStudent = profile?.roles?.includes('STUDENT') ?? false;

  const enrollmentsQuery = useMyEnrollments({ pageSize: 100 }, isStudent);
  const coursesQuery = useCourses({ pageSize: 100 });
  const certificatesQuery = useMyCertificates({ pageSize: 100 });

  const avatar = useAvatarImage(profile?.id);
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { fullName: '', phone: '', bio: '' },
  });

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        fullName: profile.fullName,
        phone: profile.phone ?? '',
        bio: profile.bio ?? '',
      });
    }
  }, [profile, profileForm]);

  async function onProfileSubmit(values: ProfileFormValues) {
    try {
      await updateProfile.mutateAsync({
        fullName: values.fullName.trim(),
        phone: values.phone?.trim() || undefined,
        bio: values.bio?.trim() || undefined,
      });
      toast.success('Profile updated successfully.');
    } catch {
      toast.error('Could not update your profile', 'Please check the form and try again.');
    }
  }

  async function onPasswordSubmit(values: ChangePasswordValues) {
    setIsChangingPassword(true);
    try {
      await authClient.post('/auth/change-password', values);
      toast.success(
        'Password updated successfully.',
        'Use your new password next time you sign in.',
      );
      passwordForm.reset();
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Could not change your password. Please verify your current password.';
      passwordForm.setError('currentPassword', { message });
      toast.error('Password update failed', message);
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error('Invalid image format', 'Please upload a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image is too large', 'Image size must be less than 5 MB.');
      return;
    }

    try {
      await uploadAvatar.mutateAsync(file);
      toast.success('Profile image updated successfully.');
    } catch {
      toast.error('Could not upload your photo', 'Please try again.');
    }
  }

  async function handleAvatarRemove() {
    try {
      await deleteAvatar.mutateAsync();
      toast.success('Profile photo removed.');
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
        <PageHeader
          title="Profile & Security"
          description="Manage your account profile and security."
        />
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
      <PageHeader
        title="Profile & Security"
        description="Manage your student profile, avatar, learning journey, and account credentials."
      />

      {/* Top Profile Summary Card Banner */}
      {isLoading ? (
        <ProfileSkeleton className="h-40" />
      ) : (
        <Reveal>
          <Card className="overflow-hidden border-border/80 shadow-xs">
            <div className="h-14 bg-linear-to-r from-teal-600 via-emerald-600 to-sky-600" />
            <CardContent className="px-6 pb-5 pt-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                  <div className="relative -mt-7 shrink-0">
                    <Avatar className="size-18 border-4 border-card shadow-md ring-1 ring-border/20">
                      <AvatarImage
                        src={avatar.url ?? undefined}
                        alt={profile?.fullName ?? 'Student'}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-brand text-base font-bold text-primary-foreground">
                        {profile?.fullName ? (
                          initials(profile.fullName.split(' ')[0], profile.fullName.split(' ')[1])
                        ) : (
                          <UserCircle className="size-8" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {avatar.isLoading && <Skeleton className="absolute inset-0 rounded-full" />}
                  </div>
                  <div className="text-center sm:text-left pt-1 sm:pt-0">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      <h2 className="text-lg font-bold tracking-tight text-foreground">
                        {profile?.fullName || 'Student Account'}
                      </h2>
                      <Badge
                        variant="secondary"
                        className="bg-brand/15 text-brand text-[11px] font-medium"
                      >
                        <GraduationCap className="mr-1 size-3.5" />
                        Student
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-muted-foreground text-[11px] font-normal"
                      >
                        <CheckCircle2 className="mr-1 size-3 text-emerald-600 dark:text-emerald-400" />
                        Verified
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                      <Mail className="size-3 text-muted-foreground" />
                      <span>{profile?.email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 sm:items-end pt-1 sm:pt-0">
                  <div className="flex w-40 items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Profile:</span>
                    <Progress value={completionPercent} className="h-1.5" />
                    <span className="shrink-0 text-xs font-semibold text-foreground">
                      {completionPercent}%
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
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
                      className="gap-2 h-8 text-xs shadow-xs"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadAvatar.isPending}
                    >
                      {uploadAvatar.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Camera className="size-3.5 text-muted-foreground" />
                      )}
                      {uploadAvatar.isPending ? 'Uploading...' : 'Change Photo'}
                    </Button>
                    {avatar.url && (
                      <ConfirmDialog
                        trigger={
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={deleteAvatar.isPending}
                          >
                            {deleteAvatar.isPending ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                            Remove
                          </Button>
                        }
                        title="Remove profile photo?"
                        description="Your avatar will revert to your name initials."
                        confirmLabel="Remove photo"
                        variant="destructive"
                        onConfirm={handleAvatarRemove}
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Personal Information Form */}
        <div className="lg:col-span-7">
          <Reveal delaySeconds={0.05}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="size-4 text-brand" />
                  <CardTitle className="text-base">Personal Information</CardTitle>
                </div>
                <CardDescription>
                  Update your contact details and student profile biography.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" {...profileForm.register('fullName')} />
                      {profileForm.formState.errors.fullName && (
                        <p className="text-xs text-destructive">
                          {profileForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="flex items-center gap-1.5">
                          <span>Email Address</span>
                          <Lock className="size-3 text-muted-foreground" />
                        </Label>
                        <Input
                          id="email"
                          value={profile?.email ?? ''}
                          readOnly
                          disabled
                          className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Primary login identifier
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Input
                            id="phone"
                            {...profileForm.register('phone')}
                            placeholder="+251 9XX XXX XXX"
                            className="pl-8"
                          />
                          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                        {profileForm.formState.errors.phone && (
                          <p className="text-xs text-destructive">
                            {profileForm.formState.errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bio">Biography</Label>
                      <Textarea
                        id="bio"
                        rows={4}
                        {...profileForm.register('bio')}
                        placeholder="Tell instructors and fellow learners a bit about your background..."
                      />
                      {profileForm.formState.errors.bio && (
                        <p className="text-xs text-destructive">
                          {profileForm.formState.errors.bio.message}
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={!profileForm.formState.isDirty || updateProfile.isPending}
                      >
                        {updateProfile.isPending && (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* Right Column: Account Security & Password */}
        <div className="lg:col-span-5">
          <Reveal delaySeconds={0.08}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-brand" />
                  <CardTitle className="text-base">Change Password</CardTitle>
                </div>
                <CardDescription>
                  Keep your account secure by using a strong password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-3.5"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Enter current password"
                        className="pr-10"
                        {...passwordForm.register('currentPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-xs text-destructive">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        className="pr-10"
                        {...passwordForm.register('newPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-xs text-destructive">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-type new password"
                        className="pr-10"
                        {...passwordForm.register('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="rounded-md border border-border/70 bg-muted/40 p-3 text-[11px] text-muted-foreground">
                    <p className="font-semibold text-foreground">Password requirements:</p>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5">
                      <li>Minimum 8 characters long</li>
                      <li>Uppercase and lowercase letters</li>
                      <li>At least one number &amp; one symbol</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isChangingPassword || passwordForm.formState.isSubmitting}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </div>

      {/* Learning Stats */}
      <Reveal delaySeconds={0.1}>
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <SummaryCard
            title="Learning Statistics"
            rows={[
              { label: 'Enrolled courses', value: enrollments.length },
              { label: 'In progress', value: inProgress.length },
              { label: 'Completed courses', value: completed.length },
              { label: 'Certificates earned', value: certificatesEarned },
            ]}
          />
        )}
      </Reveal>

      {/* Certificates & Achievements */}
      <Reveal delaySeconds={0.12}>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-brand" />
              <CardTitle className="text-base">Achievements &amp; Certificates</CardTitle>
            </div>
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

      {/* Courses in Progress & Completed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal delaySeconds={0.14}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-brand" />
                <CardTitle className="text-base">Current Courses</CardTitle>
              </div>
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
                      thumbnailKey={enrollment.thumbnailKey}
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

        <Reveal delaySeconds={0.16}>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <CardTitle className="text-base">Completed Courses</CardTitle>
              </div>
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
                      thumbnailKey={enrollment.thumbnailKey}
                      title={enrollment.courseTitle}
                      progressPercent={enrollment.progressPercentage}
                    />
                  ))
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </ContentContainer>
  );
}
