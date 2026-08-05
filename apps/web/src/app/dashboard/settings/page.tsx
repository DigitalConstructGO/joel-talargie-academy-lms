import { Bell, Palette, Shield } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { SectionHeader } from '@/components/common/section-header';
import { ContentContainer } from '@/components/layout/content-container';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const preferenceGroups = [
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Choose what you want to be notified about.',
    items: [
      { id: 'notify-learning', label: 'Learning updates' },
      { id: 'notify-payments', label: 'Payment updates' },
    ],
  },
  {
    icon: Palette,
    title: 'Appearance',
    description: 'Use the theme toggle in the header to switch light, dark, or system.',
    items: [],
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Password and session management will be implemented in a later phase.',
    items: [],
  },
];

export default function SettingsPage() {
  return (
    <ContentContainer>
      <PageHeader title="Settings" description="Manage your account preferences." />
      <div className="space-y-6">
        {preferenceGroups.map((group) => (
          <Card key={group.title}>
            <CardContent className="space-y-4 pt-6">
              <SectionHeader
                title={group.title}
                description={group.description}
                actions={<group.icon className="size-5 text-muted-foreground" aria-hidden="true" />}
              />
              {group.items.length > 0 && (
                <div className="space-y-3 border-t border-border pt-4">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <Label htmlFor={item.id} className="font-normal">
                        {item.label}
                      </Label>
                      <Switch id={item.id} disabled />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ContentContainer>
  );
}
