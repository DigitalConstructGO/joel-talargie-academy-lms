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
  /**
   * Permission code required to see/access this item - matches a backend
   * `PermissionCode` (e.g. `'users.read'`). Enforced live: `AppSidebar`
   * filters the nav by it, and `AuthorizationGate`
   * (`@/components/auth/authorization-gate`) blocks direct navigation to
   * its route via `@/lib/authorization/nav-permissions`.
   */
  permission?: string;
  /** Renders as a non-interactive row instead of a link - the route itself may still be reachable directly. */
  disabled?: boolean;
  items?: NavItem[];
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}
