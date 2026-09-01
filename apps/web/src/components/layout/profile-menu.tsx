'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, LogOut, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores';
import { useLogout } from '@/hooks/use-logout';

import { useLanguage } from '@/lib/i18n/language-provider';

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || 'U';
}

export function ProfileMenu() {
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const handleLogout = useLogout();
  const [loggingOut, setLoggingOut] = useState(false);

  const onSignOut = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await handleLogout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Account menu">
          <Avatar className="size-7">
            <AvatarImage src={user?.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-xs">
              {user ? initials(user.firstName, user.lastName) : <UserCircle className="size-4" />}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
            {user ? `${user.firstName} ${user.lastName}` : 'Account'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user?.email ?? 'Not signed in'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.dashboard.profile}>
            <UserCircle className="size-4" />
            {t('sidebar.profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onSignOut}
          disabled={loggingOut}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2"
        >
          {loggingOut ? (
            <>
              <Loader2 className="size-4 animate-spin text-destructive" />
              <span>{t('nav.signingOut')}</span>
            </>
          ) : (
            <>
              <LogOut className="size-4" />
              <span>{t('nav.logout')}</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
