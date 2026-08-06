'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Moon, Settings, Sun, UserCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores';
import { toast } from '@/lib/toast';
import type { NavItem, NavSection } from '@/types';

export interface CommandPaletteProps {
  sections: NavSection[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function flattenNavItems(sections: NavSection[]): NavItem[] {
  const items: NavItem[] = [];
  const visit = (navItems: NavItem[]) => {
    for (const item of navItems) {
      if (item.href !== '#') items.push(item);
      if (item.items?.length) visit(item.items);
    }
  };
  sections.forEach((section) => visit(section.items));
  return items;
}

/** Global Cmd/Ctrl+K command palette - navigation search plus a handful of account quick actions. */
export function CommandPalette({ sections, open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const navItems = useMemo(() => flattenNavItems(sections), [sections]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  async function handleLogout() {
    onOpenChange(false);
    try {
      await logout();
      toast.success('Signed out');
      router.replace(ROUTES.auth.login);
    } catch {
      toast.error('Could not sign out', 'Please try again.');
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages and actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem key={item.href} value={item.label} onSelect={() => go(item.href)}>
              {item.icon ? <item.icon /> : <LayoutDashboard />}
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem value="View profile" onSelect={() => go(ROUTES.dashboard.profile)}>
            <UserCircle />
            <span>View profile</span>
          </CommandItem>
          <CommandItem value="Open settings" onSelect={() => go(ROUTES.dashboard.settings)}>
            <Settings />
            <span>Open settings</span>
          </CommandItem>
          <CommandItem
            value="Switch to light theme"
            onSelect={() => {
              setTheme('light');
              onOpenChange(false);
            }}
          >
            <Sun />
            <span>Switch to light theme</span>
          </CommandItem>
          <CommandItem
            value="Switch to dark theme"
            onSelect={() => {
              setTheme('dark');
              onOpenChange(false);
            }}
          >
            <Moon />
            <span>Switch to dark theme</span>
          </CommandItem>
          <CommandItem value="Sign out" onSelect={handleLogout}>
            <LogOut />
            <span>Sign out</span>
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Manages the Cmd/Ctrl+K keyboard shortcut for opening a CommandPalette. */
export function useCommandPaletteState() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
}
