import type { LucideIcon } from 'lucide-react';

export interface NavBadge {
  label: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline';
}

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  /** Permission code required to see this item. Placeholder only in Phase 1 - not enforced yet. */
  permission?: string;
  items?: NavItem[];
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}
