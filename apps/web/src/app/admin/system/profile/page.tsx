'use client';

import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Camera, Loader2, Trash2, UserCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile, useUpdateProfile } from '@/features/account/hooks/use-account';
import {
  useAvatarImage,
  useDeleteAvatar,
  useUploadAvatar,
} from '@/features/account/hooks/use-avatar';
import { toast } from '@/lib/toast';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const profileFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(160),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  bio: z.string().trim().max(1000).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

/** Reuses `features/account/` - `/me/profile` and `/storage/avatar` are role-agnostic (no `@Roles()` guard), so this is the exact same real data as the student Profile page. */
export default function AdminProfilePage() {
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const profile = profileQuery.data;
  const avatar = useAvatarImage(profile?.id);
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (profile)
      reset({ fullName: profile.fullName, phone: profile.phone ?? '', bio: profile.bio ?? '' });
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

  const isLoading = profileQuery.isLoading;

  return (
    <ContentContainer>
      <PageHeader title="Profile" description="Your administrator account." />

      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="relative">
            <Avatar className="size-16">
              <AvatarImage src={avatar.url ?? undefined} alt="" />
              <AvatarFallback>
                <UserCircle className="size-8" />
              </AvatarFallback>
            </Avatar>
            {avatar.isLoading && <Skeleton className="absolute inset-0 rounded-full" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{profile?.fullName || 'Your account'}</CardTitle>
              <Badge variant="secondary">Administrator</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {profile?.email ?? 'Sign in to view your profile'}
            </p>
            <div className="mt-2 flex gap-2">
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
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bio">Biography (optional)</Label>
                <Textarea id="bio" rows={3} {...register('bio')} />
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
    </ContentContainer>
  );
}
