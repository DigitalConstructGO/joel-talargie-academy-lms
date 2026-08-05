import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { NotificationBell } from '@/components/layout/notification-bell';
import { ProfileMenu } from '@/components/layout/profile-menu';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export interface SiteHeaderProps {
  breadcrumb?: React.ReactNode;
}

export function SiteHeader({ breadcrumb }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="min-w-0 flex-1">{breadcrumb}</div>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}
