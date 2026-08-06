import Link from 'next/link';
import { GraduationCap, Search } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/layout/notification-bell';
import { ProfileMenu } from '@/components/layout/profile-menu';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';

export interface SiteHeaderProps {
  breadcrumb?: React.ReactNode;
  onOpenCommandPalette?: () => void;
}

export function SiteHeader({ breadcrumb, onOpenCommandPalette }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Link href={ROUTES.home} className="flex shrink-0 items-center gap-2 md:hidden">
        <span className="flex size-6 items-center justify-center rounded-md bg-brand text-brand-foreground">
          <GraduationCap className="size-3.5" />
        </span>
        <span className="truncate text-sm font-semibold">{siteConfig.shortName}</span>
      </Link>
      <div className="min-w-0 flex-1">{breadcrumb}</div>
      <div className="flex items-center gap-1">
        {onOpenCommandPalette && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            className="hidden h-8 gap-2 px-2.5 text-muted-foreground sm:inline-flex"
          >
            <Search className="size-3.5" />
            <span className="text-xs">Search…</span>
            <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
              ⌘K
            </kbd>
          </Button>
        )}
        {onOpenCommandPalette && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenCommandPalette}
            aria-label="Search"
            className="sm:hidden"
          >
            <Search className="size-4" />
          </Button>
        )}
        <NotificationBell />
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}
