'use client';

import { UserCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <ContentContainer>
      <PageHeader title="Profile" description="Your personal information." />
      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Avatar className="size-16">
            <AvatarImage src={user?.avatarUrl ?? undefined} alt="" />
            <AvatarFallback>
              <UserCircle className="size-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user ? `${user.firstName} ${user.lastName}` : 'Your account'}</CardTitle>
            <CardDescription>{user?.email ?? 'Sign in to view your profile'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" value={user?.firstName ?? ''} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" value={user?.lastName ?? ''} readOnly disabled />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ''} readOnly disabled />
          </div>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        Profile editing will be implemented in a later phase.
      </p>
    </ContentContainer>
  );
}
