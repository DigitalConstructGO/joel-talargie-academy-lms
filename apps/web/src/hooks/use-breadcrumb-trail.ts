'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
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

const DASHBOARD_COURSE_DETAIL_PATTERN = /^\/dashboard\/browse-courses\/[^/]+$/;

/**
 * A couple of dashboard routes are deliberately absent from the nav tree
 * (Checkout isn't a sidebar destination; the course-detail route is
 * dynamic) so `findChain` can never match them - special-case their
 * breadcrumb trail here instead of forcing them into the nav config.
 */
function specialCaseCrumbs(pathname: string, home: BreadcrumbCrumb): BreadcrumbCrumb[] | null {
  if (pathname === ROUTES.dashboard.checkout) {
    return [home, { label: 'My Courses', href: ROUTES.dashboard.courses }, { label: 'Checkout' }];
  }
  if (DASHBOARD_COURSE_DETAIL_PATTERN.test(pathname)) {
    return [
      home,
      { label: 'Browse Courses', href: ROUTES.dashboard.browseCourses },
      { label: 'Course Details' },
    ];
  }
  return null;
}

/**
 * Derives a breadcrumb trail for the current route by walking a NavSection
 * tree - no per-page wiring required. Always starts with a real "Home"
 * crumb (not the portal label) so the trail never reads as the current
 * page's name repeated against itself, e.g. "Dashboard > Dashboard" - the
 * root page is just "Home > Dashboard", and a flat nav item is
 * "Home > My Courses" rather than "Home > Dashboard > My Courses".
 */
export function useBreadcrumbTrail(
  sections: NavSection[],
  portalLabel: string,
  rootHref: string,
): BreadcrumbCrumb[] {
  const pathname = usePathname();

  return useMemo(() => {
    const home: BreadcrumbCrumb = { label: 'Home', href: ROUTES.home };
    if (!pathname || pathname === rootHref) return [home, { label: portalLabel }];

    const special = specialCaseCrumbs(pathname, home);
    if (special) return special;

    for (const section of sections) {
      const chain = findChain(section.items, pathname);
      if (chain) {
        return [
          home,
          ...chain.map((item, index) => ({
            label: item.label,
            href: index === chain.length - 1 ? undefined : item.href,
          })),
        ];
      }
    }

    return [home, { label: portalLabel }];
  }, [sections, pathname, portalLabel, rootHref]);
}
