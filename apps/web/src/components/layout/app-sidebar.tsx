'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronsLeft, GraduationCap, Home, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';
import { SidebarUserFooter } from '@/components/layout/sidebar-user-footer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { NavItem, NavSection } from '@/types';

export interface AppSidebarProps {
  sections: NavSection[];
  portalLabel: string;
  /** The section's own overview page (e.g. `/dashboard`) - never prefix-matched, since it's also every sibling route's path prefix. */
  rootHref: string;
  /** Returns whether the current user may see a nav item guarded by `item.permission`. Defaults to allowing everything - wire up real RBAC once it exists. */
  hasPermission?: (permission: string) => boolean;
}

/**
 * A leaf item matches its own page exactly, or a nested route under it
 * (`/dashboard/courses/42` still highlights "My Courses") - except the
 * section root itself, which is also every sibling route's own path prefix,
 * so it only ever matches exactly (otherwise "Dashboard" would light up on
 * every other page in the section). A parent with children is active when
 * its own page matches OR any descendant does, so a collapsible section
 * still expands/highlights for its child routes.
 */
function isItemActive(pathname: string | null, item: NavItem, rootHref: string): boolean {
  const isSectionRoot = item.href === rootHref;
  const ownMatch =
    item.href !== '#' &&
    (pathname === item.href ||
      (!isSectionRoot && (pathname?.startsWith(`${item.href}/`) ?? false)));
  const childMatch = item.items?.some((child) => isItemActive(pathname, child, rootHref)) ?? false;
  return ownMatch || childMatch;
}

function filterByPermission(
  items: NavItem[],
  hasPermission: (permission: string) => boolean,
): NavItem[] {
  return items
    .filter((item) => !item.permission || hasPermission(item.permission))
    .map((item) =>
      item.items?.length ? { ...item, items: filterByPermission(item.items, hasPermission) } : item,
    );
}

/**
 * The base SidebarMenuButton's hover/active states use `--sidebar-accent` (a
 * dark neutral) for both - the design wants three distinct states: a subtle
 * translucent-white hover, and an active item rendered as a light green chip
 * (not a solid brand-colored pill) with dark green text/icon.
 *
 * `rounded-sm` overrides the base `rounded-md` (which in this token scale is
 * 20px - too round for a small tile, reads as a circle rather than a chip).
 * `group-data-[collapsible=icon]:min-h-8` resets the min-height back down in
 * the collapsed rail: `min-height` acts as a floor independent of the base
 * component's `!size-8` on `height`, so without this reset the button stayed
 * 40px tall inside a 32px-wide box - a stretched pill, not a square icon tile.
 *
 * `group-data-[collapsible=icon]:justify-center` plus hiding the label span
 * (see below) is what actually centers the icon when collapsed - the base
 * component doesn't hide its label on collapse, so the icon was sharing the
 * row with an invisible-but-still-flexed label, skewing it off-center. The
 * icon also drops back to `size-4`: at `size-5` it no longer fit inside the
 * collapsed button's fixed 32px box once `!p-2` claims 8px on every side.
 */
const navItemClassName =
  'min-h-9 gap-3 text-white rounded-sm px-4 py-3 transition-colors duration-300 ease-in-out hover:bg-white/8 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-active-background data-[active=true]:text-sidebar-active-foreground data-[active=true]:font-medium data-[active=true]:hover:bg-sidebar-active-background data-[active=true]:hover:text-sidebar-active-foreground group-data-[collapsible=icon]:min-h-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 [&>svg]:size-5 group-data-[collapsible=icon]:[&>svg]:size-4';

/** Hides a nav item's label when the sidebar collapses to icon-only, without leaving it as an invisible flex child that would skew the icon off-center. */
const navLabelClassName =
  'min-w-0 flex-1 truncate transition-[opacity,width] duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:opacity-0';

/** Closes the off-canvas sheet on mobile - the sheet's own default close button is suppressed so this one, aligned with the wordmark, can take its place instead. */
function SidebarMobileCloseButton() {
  const { isMobile, setOpenMobile } = useSidebar();
  if (!isMobile) return null;

  return (
    <button
      type="button"
      onClick={() => setOpenMobile(false)}
      aria-label="Close sidebar"
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-white/8 hover:text-sidebar-foreground"
    >
      <X className="size-4" />
    </button>
  );
}

export function AppSidebar({
  sections,
  portalLabel,
  rootHref,
  hasPermission = () => true,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="shadow-sidebar">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-4 border-b border-sidebar-border px-2 py-3.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link href={ROUTES.home} className="flex min-w-0 items-center gap-2">
            <span className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:flex">
              <GraduationCap className="size-4" />
            </span>
            <span className="min-w-0 truncate text-xl  font-extrabold text-white transition-[opacity,width] duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
              {siteConfig.name}
            </span>
          </Link>
          <SidebarMobileCloseButton />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-4">
        {sections.map((section, index) => {
          const items = filterByPermission(section.items, hasPermission);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={section.label ?? index}>
              {section.label && (
                <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60">
                  {section.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {items.map((item) =>
                    item.items?.length ? (
                      <Collapsible
                        key={item.href}
                        defaultOpen={isItemActive(pathname, item, rootHref)}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.label} className={navItemClassName}>
                              {item.icon && <item.icon />}
                              <span className={navLabelClassName}>{item.label}</span>
                              <ChevronRight className="ml-auto shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                            <SidebarMenuSub>
                              {item.items.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isItemActive(pathname, child, rootHref)}
                                    className={navItemClassName}
                                  >
                                    <Link href={child.href}>
                                      {child.icon && <child.icon />}
                                      <span className={navLabelClassName}>{child.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : item.disabled ? (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          aria-disabled="true"
                          tooltip={item.label}
                          className={cn(
                            navItemClassName,
                            'pointer-events-none cursor-not-allowed opacity-60',
                          )}
                        >
                          {item.icon && <item.icon />}
                          <span className={navLabelClassName}>{item.label}</span>
                        </SidebarMenuButton>
                        {item.badge && (
                          <SidebarMenuBadge>
                            <Badge
                              variant={item.badge.variant ?? 'secondary'}
                              className="text-[10px]"
                            >
                              {item.badge.label}
                            </Badge>
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    ) : (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isItemActive(pathname, item, rootHref)}
                          tooltip={item.label}
                          className={navItemClassName}
                        >
                          <Link href={item.href}>
                            {item.icon && <item.icon />}
                            <span className={navLabelClassName}>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                        {item.badge && <SidebarMenuBadge>{item.badge.label}</SidebarMenuBadge>}
                      </SidebarMenuItem>
                    ),
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border pt-2">
        <SidebarUserFooter roleLabel={portalLabel} />
        <SidebarMenu></SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
