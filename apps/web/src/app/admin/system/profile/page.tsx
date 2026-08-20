'use client';

import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  User,
  UserCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useProfile, useUpdateProfile } from '@/features/account/hooks/use-account';
import {
  useAvatarImage,
  useDeleteAvatar,
  useUploadAvatar,
} from '@/features/account/hooks/use-avatar';
import { usePermissions } from '@/hooks/use-permissions';
import { authClient } from '@/lib/api/auth-client';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/lib/toast';

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

export default function AdminProfilePage() {
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const profile = profileQuery.data;
  const avatar = useAvatarImage(profile?.id);
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { permissions, isAdministrator } = usePermissions();

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const permissionsByModule = permissions.reduce<Record<string, string[]>>((acc, code) => {
    const domain = code.split('.')[0] ?? code;
    (acc[domain] ??= []).push(code);
    return acc;
  }, {});

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

  const isLoading = profileQuery.isLoading;

  if (profileQuery.isError) {
    return (
      <ContentContainer>
        <PageBreadcrumb
          items={[
            { label: 'Dashboard', href: ROUTES.admin.root },
            { label: 'System', href: ROUTES.admin.system },
            { label: 'Profile & Security' },
          ]}
        />
        <PageHeader
          title="Profile & Security"
          description="Manage your account profile and security settings."
        />
        <ErrorState
          onRetry={() => profileQuery.refetch()}
          description="Unable to load your profile."
        />
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'System', href: ROUTES.admin.system },
          { label: 'Profile & Security' },
        ]}
      />
      <PageHeader
        title="Profile & Security"
        description="Manage your administrator profile, avatar, credentials, and platform security."
        actions={
          <ShieldCheck
            className="hidden size-5 text-muted-foreground sm:block"
            aria-hidden="true"
          />
        }
      />

      {/* Top Profile Summary & Avatar Header Card */}
      <Card className="overflow-hidden border-border/80 shadow-xs">
        <div className="h-14 bg-linear-to-r from-emerald-600 via-teal-600 to-sky-600" />
        <CardContent className="px-6 pb-5 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <div className="relative -mt-7 shrink-0">
                <Avatar className="size-18 border-4 border-card shadow-md ring-1 ring-border/20">
                  <AvatarImage
                    src={avatar.url ?? undefined}
                    alt={profile?.fullName ?? 'User'}
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
                    {profile?.fullName || 'Administrator'}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium"
                  >
                    <ShieldCheck className="mr-1 size-3 text-emerald-600 dark:text-emerald-400" />
                    Administrator
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
                  <span>{profile?.email ?? 'Sign in to view your profile'}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 pt-1 sm:pt-0">
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
        </CardContent>
      </Card>

      {/* Main Two-Column Structured Orientation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Personal Information */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-4 text-brand" />
                <CardTitle className="text-base">Personal Information</CardTitle>
              </div>
              <CardDescription>
                Update your personal details and how your name is displayed across the platform.
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
                    <Input
                      id="fullName"
                      placeholder="e.g. Habtamu Baye"
                      {...profileForm.register('fullName')}
                    />
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
                        Managed via system administrator
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
                    <Label htmlFor="bio">Biography / Role Summary</Label>
                    <Textarea
                      id="bio"
                      rows={4}
                      {...profileForm.register('bio')}
                      placeholder="Tell the team a bit about your responsibilities or background..."
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
                      {updateProfile.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                      {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security & Role Permissions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-brand" />
                <CardTitle className="text-base">Change Password</CardTitle>
              </div>
              <CardDescription>
                Ensure your account is using a long, random password to stay secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3.5">
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
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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

          {/* Permissions / Authorization Scope Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-brand" />
                <CardTitle className="text-base">Role &amp; Permissions</CardTitle>
              </div>
              <CardDescription>Active platform privileges for this account.</CardDescription>
            </CardHeader>
            <CardContent>
              {isAdministrator ? (
                <div className="flex items-center gap-2.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-200">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Full administrator access across all system entities.</span>
                </div>
              ) : Object.keys(permissionsByModule).length === 0 ? (
                <p className="text-xs text-muted-foreground">Standard permissions assigned.</p>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(permissionsByModule).map(([module, codes]) => (
                    <div key={module}>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {module} ({codes.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {codes.map((code) => (
                          <Badge key={code} variant="secondary" className="text-[10px] py-0 px-1.5">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ContentContainer>
  );
}
