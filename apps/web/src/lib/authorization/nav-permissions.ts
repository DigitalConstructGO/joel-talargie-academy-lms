import { can, canAny } from './permissions';
import type { NavItem, NavSection } from '@/types';

export interface FlatNavEntry {
  href: string;
  permission?: string;
}

function flattenItems(items: NavItem[], out: FlatNavEntry[]) {
  for (const item of items) {
    if (item.href !== '#') out.push({ href: item.href, permission: item.permission });
    if (item.items?.length) flattenItems(item.items, out);
  }
}

/** Every nav item in the tree (parents and children alike) as a flat `{ href, permission }` list. */
export function flattenNav(sections: NavSection[]): FlatNavEntry[] {
  const out: FlatNavEntry[] = [];
  for (const section of sections) flattenItems(section.items, out);
  return out;
}

/** Dedup'd union of every permission code guarding any item in the tree. */
export function collectPermissions(sections: NavSection[]): string[] {
  return [
    ...new Set(
      flattenNav(sections)
        .map((entry) => entry.permission)
        .filter((permission): permission is string => Boolean(permission)),
    ),
  ];
}

/**
 * The permission required to view `pathname`, resolved by longest-prefix
 * match against the flattened nav tree - a sub-route with no direct nav
 * entry (e.g. `/admin/academics/courses/123/edit`) inherits its nearest
 * matched ancestor's requirement (`/admin/academics/courses`). Returns
 * `undefined` when nothing in the nav matches, or the closest match is
 * itself unguarded.
 */
export function resolveRequiredPermission(
  pathname: string,
  sections: NavSection[],
): string | undefined {
  let best: FlatNavEntry | undefined;
  for (const entry of flattenNav(sections)) {
    const matches = pathname === entry.href || pathname.startsWith(`${entry.href}/`);
    if (matches && (!best || entry.href.length > best.href.length)) best = entry;
  }
  return best?.permission;
}

export interface RouteGuardOptions {
  isAdministrator?: boolean;
  /**
   * Baseline permission set required to be in this portal at all, applied
   * whenever `pathname` has no *specifically* guarded requirement - covers
   * both genuinely unmatched routes and a matched-but-unguarded item (e.g.
   * the admin `Dashboard` root, which no nav item's `permission` field
   * protects but which shouldn't be reachable by every authenticated user
   * regardless). Omit for portals where every route should stay open by
   * default (e.g. the student dashboard, where nothing in the nav is
   * currently permission-gated).
   */
  fallbackPermissions?: string[];
}

export function isRouteAllowed(
  pathname: string,
  sections: NavSection[],
  granted: string[],
  options: RouteGuardOptions = {},
): boolean {
  if (options.isAdministrator) return true;

  const required = resolveRequiredPermission(pathname, sections);
  if (required) return can(granted, required);
  if (options.fallbackPermissions) return canAny(granted, options.fallbackPermissions);
  return true;
}
