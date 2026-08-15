'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores';
import { useLogout } from '@/hooks/use-logout';
import { ROUTES } from '@/constants/routes';

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || 'U';
}

export interface SidebarUserFooterProps {
  roleLabel: string;
  profileHref?: string;
}

/** Sidebar footer profile block - clickable avatar + name/role on the left linking to unified profile, logout icon-button on the right. */
export function SidebarUserFooter({ roleLabel, profileHref }: SidebarUserFooterProps) {
  const user = useAuthStore((state) => state.user);
  const handleLogout = useLogout();
  const name = user ? `${user.firstName} ${user.lastName}` : 'Account';
  const targetHref =
    profileHref ??
    (roleLabel.toLowerCase().includes('admin')
      ? ROUTES.admin.systemProfile
      : ROUTES.dashboard.profile);

  return (
    <div className="flex items-center gap-2 px-3 py-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:px-0">
      <Link
        href={targetHref}
        className="group/user flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:p-1"
        title="View profile and account settings"
        aria-label="View profile and account settings"
      >
        <Avatar className="size-8 shrink-0 ring-2 ring-sidebar-primary/80 transition-transform group-hover/user:scale-105">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={name} />
          <AvatarFallback className="bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            {user ? initials(user.firstName, user.lastName) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-left leading-tight transition-[opacity,width] duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:opacity-0">
          <span className="truncate text-sm font-medium text-sidebar-foreground group-hover/user:text-sidebar-accent-foreground">
            {name}
          </span>
          <span className="truncate text-[10px] font-bold uppercase tracking-wider text-sidebar-primary">
            {roleLabel}
          </span>
        </div>
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Logout"
        title="Logout"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
