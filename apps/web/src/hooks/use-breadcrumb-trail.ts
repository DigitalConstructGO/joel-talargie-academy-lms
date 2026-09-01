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
 * (the course-detail route is dynamic) so `findChain` can never match them -
 * special-case their breadcrumb trail here instead of forcing them into the
 * nav config. (Checkout renders its own page-level breadcrumb that includes
 * the actual course title, so the dashboard layout suppresses the global one
 * for it.)
 */
function specialCaseCrumbs(pathname: string, home: BreadcrumbCrumb): BreadcrumbCrumb[] | null {
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
import { useLanguage } from '@/lib/i18n/language-provider';

const BREADCRUMB_LABEL_MAP_AM: Record<string, string> = {
  Home: 'መነሻ',
  Dashboard: 'ዳሽቦርድ',
  Overview: 'ዳሽቦርድ',
  'Browse Catalog': 'ኮርሶች ይፈልጉ',
  'Browse Courses': 'ኮርሶች ይፈልጉ',
  'My Courses': 'የእኔ ኮርሶች',
  Payments: 'ክፍያዎች',
  Notifications: 'ማስታወቂያዎች',
  'Profile & Security': 'መገለጫ እና ደህንነት',
  Profile: 'መገለጫ እና ደህንነት',
  Wishlist: 'የምኞት ዝርዝር',
  Certificates: 'ሰርተፊኬቶች',
  'Academic Management': 'ትምህርት አስተዳደር',
  'User Management': 'ተጠቃሚዎች',
  'Financial Management': 'ፋይናንስ',
  'Certificate Management': 'ሰርተፊኬቶች',
  'Verify Certificate': 'ሰርተፊኬት ማረጋገጫ',
  'Reports & Analytics': 'ሪፖርቶች',
  Communication: 'ማስታወቂያዎች',
  System: 'ሲስተም',
  Users: 'ተጠቃሚዎች',
  Roles: 'ሚናዎች',
  Permissions: 'ፈቃዶች',
  Courses: 'ኮርሶች',
  Categories: 'ምድቦች',
  Enrollments: 'ምዝገባዎች',
  Instructors: 'አስተማሪዎች',
  'Promo Codes': 'ፕሮሞ ኮዶች',
  'Payment Methods': 'የክፍያ መንገዶች',
  'Email Templates': 'የኢሜይል ቴምፕሌቶች',
  'Activity Logs': 'የእንቅስቃሴ መዝገቦች',
  'Academy Settings': 'የአካዳሚ መቼቶች',
};

export function useBreadcrumbTrail(
  sections: NavSection[],
  portalLabel: string,
  rootHref: string,
): BreadcrumbCrumb[] {
  const pathname = usePathname();
  const { locale } = useLanguage();

  return useMemo(() => {
    const translateLabel = (label: string) =>
      locale === 'am' ? BREADCRUMB_LABEL_MAP_AM[label] || label : label;

    const home: BreadcrumbCrumb = { label: translateLabel('Home'), href: ROUTES.home };
    if (!pathname || pathname === rootHref) return [home, { label: translateLabel(portalLabel) }];

    const special = specialCaseCrumbs(pathname, home);
    if (special) {
      return special.map((crumb) => ({
        ...crumb,
        label: translateLabel(crumb.label),
      }));
    }

    for (const section of sections) {
      const chain = findChain(section.items, pathname);
      if (chain) {
        return [
          home,
          ...chain.map((item, index) => ({
            label: translateLabel(item.label),
            href: index === chain.length - 1 ? undefined : item.href,
          })),
        ];
      }
    }

    return [home, { label: translateLabel(portalLabel) }];
  }, [sections, pathname, portalLabel, rootHref, locale]);
}
