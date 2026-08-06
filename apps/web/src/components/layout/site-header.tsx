import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { NotificationBell } from '@/components/layout/notification-bell';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { ProfileMenu } from '@/components/layout/profile-menu';
import { CommandPalette } from '@/components/dashboard/command-palette';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';
import type { NavSection } from '@/types';

export interface SiteHeaderProps {
  breadcrumb?: React.ReactNode;
  /** Page title shown under the breadcrumb - only the two dashboard home pages set this. */
  title?: string;
  sections: NavSection[];
  commandPaletteOpen: boolean;
  onCommandPaletteOpenChange: (open: boolean) => void;
}

export function SiteHeader({
  breadcrumb,
  title,
  sections,
  commandPaletteOpen,
  onCommandPaletteOpenChange,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/80 px-4 shadow-navbar backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <Link
        href={ROUTES.home}
        aria-label={siteConfig.shortName}
        className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground md:hidden"
      >
        <GraduationCap className="size-3.5" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="hidden sm:block">{breadcrumb}</div>
        {title && <h1 className="truncate text-xl font-bold text-foreground">{title}</h1>}
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <CommandPalette
          sections={sections}
          open={commandPaletteOpen}
          onOpenChange={onCommandPaletteOpenChange}
        />
        <NotificationBell />
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        {/* On desktop, the profile/logout affordance lives in the sidebar footer instead. */}
        <div className="md:hidden">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
