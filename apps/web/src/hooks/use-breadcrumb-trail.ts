'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { NavItem, NavSection } from '@/types';

export interface BreadcrumbCrumb {
  label: string;
  href?: string;
}

function findChain(items: NavItem[], pathname: string): NavItem[] | null {
  for (const item of items) {
    if (item.href !== '#' && item.href === pathname) return [item];
    if (item.items?.length) {
      const childChain = findChain(item.items, pathname);
      if (childChain) return [item, ...childChain];
    }
  }
  return null;
}

/** Derives a breadcrumb trail for the current route by walking a NavSection tree - no per-page wiring required. */
export function useBreadcrumbTrail(
  sections: NavSection[],
  portalLabel: string,
  rootHref: string,
): BreadcrumbCrumb[] {
  const pathname = usePathname();

  return useMemo(() => {
    if (!pathname || pathname === rootHref) return [{ label: portalLabel }];

    for (const section of sections) {
      const chain = findChain(section.items, pathname);
      if (chain) {
        return [
          { label: portalLabel, href: rootHref },
          ...chain.map((item, index) => ({
            label: item.label,
            href: index === chain.length - 1 ? undefined : item.href,
          })),
        ];
      }
    }

    return [{ label: portalLabel, href: rootHref }];
  }, [sections, pathname, portalLabel, rootHref]);
}
