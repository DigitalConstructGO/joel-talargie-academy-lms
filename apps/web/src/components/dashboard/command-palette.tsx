'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Moon, Search, Settings, Sun, UserCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { ROUTES } from '@/constants/routes';
import { useLogout } from '@/hooks/use-logout';
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

/**
 * Global Cmd/Ctrl+K search - an anchored dropdown under the header search
 * field (not a centered modal), so it doesn't dim the page and reads like
 * VS Code / Notion / Linear command search.
 */
export function CommandPalette({ sections, open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const handleLogout = useLogout();
  const navItems = useMemo(() => flattenNavItems(sections), [sections]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center gap-2 rounded-sm bg-muted px-0 text-sm text-muted-foreground transition-colors hover:bg-accent lg:w-64 lg:justify-start lg:px-4"
        >
          <Search className="size-4 shrink-0" />
          <span className="hidden flex-1 truncate text-left lg:inline">
            Search courses, mentors…
          </span>
          <kbd className="pointer-events-none hidden h-5 shrink-0 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium lg:inline-flex">
            ⌘K
          </kbd>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-90 p-0">
        <Command>
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
              <CommandItem
                value="Sign out"
                onSelect={() => {
                  onOpenChange(false);
                  handleLogout();
                }}
              >
                <LogOut />
                <span>Sign out</span>
                <CommandShortcut>⌘K</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
