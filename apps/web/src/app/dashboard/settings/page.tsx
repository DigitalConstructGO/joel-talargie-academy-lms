'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Globe, KeyRound, Mail, Palette } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { SectionHeader } from '@/components/common/section-header';
import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores';
import { useProfile, useUpdateNotificationPreferences } from '@/features/account/hooks/use-account';
import type { NotificationPreferences } from '@/features/account/types/account.types';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/lib/toast';

const LANGUAGE_OPTIONS = [{ value: 'en', label: 'English' }];

const NOTIFICATION_TOGGLES: {
  key: keyof NotificationPreferences;
  label: string;
  group: 'email' | 'inApp';
}[] = [
  { key: 'emailLearning', label: 'Learning updates', group: 'email' },
  { key: 'emailPayments', label: 'Payment updates', group: 'email' },
  { key: 'emailCertificates', label: 'Certificate updates', group: 'email' },
  { key: 'inAppLearning', label: 'Learning updates', group: 'inApp' },
  { key: 'inAppPayments', label: 'Payment updates', group: 'inApp' },
  { key: 'inAppCertificates', label: 'Certificate updates', group: 'inApp' },
];

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

function NotificationsCard() {
  const profileQuery = useProfile();
  const updatePreferences = useUpdateNotificationPreferences();
  const preferences = profileQuery.data?.notificationPreferences;

  function handleToggle(key: keyof NotificationPreferences, checked: boolean) {
    updatePreferences.mutate(
      { [key]: checked },
      { onError: () => toast.error('Could not update that preference', 'Please try again.') },
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <SectionHeader
          title="Notifications"
          description="Choose what you want to be notified about."
          actions={<Bell className="size-5 text-muted-foreground" aria-hidden="true" />}
        />
        <div className="border-t border-border pt-4">
          {profileQuery.isLoading || !preferences ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="email">
              <TabsList>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="inApp">In-app</TabsTrigger>
              </TabsList>
              {(['email', 'inApp'] as const).map((group) => (
                <TabsContent key={group} value={group} className="mt-4 space-y-3">
                  {NOTIFICATION_TOGGLES.filter((toggle) => toggle.group === group).map((toggle) => (
                    <div key={toggle.key} className="flex items-center justify-between">
                      <Label htmlFor={toggle.key} className="font-normal">
                        {toggle.label}
                      </Label>
                      <Switch
                        id={toggle.key}
                        checked={preferences[toggle.key]}
                        onCheckedChange={(checked) => handleToggle(toggle.key, checked)}
                        disabled={updatePreferences.isPending}
                      />
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState(detectTimezone);

  return (
    <ContentContainer>
      <PageHeader title="Settings" description="Manage your account preferences." />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <SectionHeader
              title="Account"
              description="Your account's sign-in email."
              actions={<Mail className="size-5 text-muted-foreground" aria-hidden="true" />}
            />
            <div className="space-y-2 border-t border-border pt-4">
              <Label htmlFor="settings-email" className="font-normal">
                Email address
              </Label>
              <Input id="settings-email" value={user?.email ?? ''} readOnly disabled />
            </div>
          </CardContent>
        </Card>

        <NotificationsCard />

        <Card>
          <CardContent className="space-y-4 pt-6">
            <SectionHeader
              title="Language & region"
              description="Choose your preferred language and timezone. Not saved to your account yet."
              actions={<Globe className="size-5 text-muted-foreground" aria-hidden="true" />}
            />
            <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-language" className="font-normal">
                  Language
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="settings-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-timezone" className="font-normal">
                  Timezone
                </Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="settings-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={timezone}>{timezone}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <SectionHeader
              title="Appearance"
              description="Use the theme toggle in the header to switch light, dark, or system."
              actions={<Palette className="size-5 text-muted-foreground" aria-hidden="true" />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <SectionHeader
              title="Privacy & account"
              description="Password, sessions, and account security."
              actions={<KeyRound className="size-5 text-muted-foreground" aria-hidden="true" />}
            />
            <div className="border-t border-border pt-4">
              <Button variant="outline" asChild>
                <Link href={ROUTES.dashboard.security}>Go to Security</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ContentContainer>
  );
}
