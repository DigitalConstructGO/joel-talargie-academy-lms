'use client';

import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores';
import { useLogout } from '@/hooks/use-logout';

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || 'U';
}

export interface SidebarUserFooterProps {
  roleLabel: string;
}

/** Sidebar footer profile block - avatar + name/role on the left, logout icon-button on the right, both collapsing to icon-only when the sidebar rail collapses. */
export function SidebarUserFooter({ roleLabel }: SidebarUserFooterProps) {
  const user = useAuthStore((state) => state.user);
  const handleLogout = useLogout();
  const name = user ? `${user.firstName} ${user.lastName}` : 'Account';

  return (
    <div className="flex items-center gap-2 px-4 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:px-0">
      <div className="flex min-w-0 flex-1 items-center gap-2 group-data-[collapsible=icon]:flex-none">
        <Avatar className="size-8 shrink-0 ring-2 ring-sidebar-primary">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="text-xs">
            {user ? initials(user.firstName, user.lastName) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden leading-tight transition-[opacity,width] duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:opacity-0">
          <span className="truncate text-sm font-medium text-sidebar-foreground">{name}</span>
          <span className="truncate text-[10px] font-bold uppercase tracking-wider text-sidebar-primary">
            {roleLabel}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Logout"
        title="Logout"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-white/8 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
