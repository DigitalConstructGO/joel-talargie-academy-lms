'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronsLeft, GraduationCap } from 'lucide-react';
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
import type { NavItem, NavSection } from '@/types';

export interface AppSidebarProps {
  sections: NavSection[];
  portalLabel: string;
  /** Returns whether the current user may see a nav item guarded by `item.permission`. Defaults to allowing everything - wire up real RBAC once it exists. */
  hasPermission?: (permission: string) => boolean;
}

function isItemActive(pathname: string | null, item: NavItem): boolean {
  if (item.href !== '#' && (pathname === item.href || pathname?.startsWith(`${item.href}/`)))
    return true;
  return item.items?.some((child) => isItemActive(pathname, child)) ?? false;
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

function SidebarCollapseButton() {
  const { state, toggleSidebar, isMobile } = useSidebar();
  if (isMobile || state === 'collapsed') return null;

  return (
    <SidebarMenuButton onClick={toggleSidebar} tooltip="Collapse sidebar">
      <ChevronsLeft />
      <span>Collapse</span>
    </SidebarMenuButton>
  );
}

export function AppSidebar({ sections, portalLabel, hasPermission = () => true }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href={ROUTES.home}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                  <GraduationCap className="size-4" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="truncate text-sm font-semibold">{siteConfig.shortName}</span>
                  <span className="truncate text-xs text-muted-foreground">{portalLabel}</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section, index) => {
          const items = filterByPermission(section.items, hasPermission);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={section.label ?? index}>
              {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) =>
                    item.items?.length ? (
                      <Collapsible
                        key={item.href}
                        defaultOpen={isItemActive(pathname, item)}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.label}>
                              {item.icon && <item.icon />}
                              <span>{item.label}</span>
                              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                            <SidebarMenuSub>
                              {item.items.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isItemActive(pathname, child)}
                                  >
                                    <Link href={child.href}>
                                      {child.icon && <child.icon />}
                                      <span>{child.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isItemActive(pathname, item)}
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            {item.icon && <item.icon />}
                            <span>{item.label}</span>
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarCollapseButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
