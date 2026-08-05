/**
 * Central route path constants. Prefer these over hardcoded string literals
 * so a path change only needs to happen in one place - notably the same
 * `/auth`, `/admin`, `/dashboard` segments enforced by `src/middleware.ts`.
 */
export const ROUTES = {
  home: '/',
  health: '/health',
  about: '/about',
  pricing: '/pricing',
  contact: '/contact',
  faq: '/faq',
  helpCenter: '/help-center',
  privacyPolicy: '/privacy-policy',
  terms: '/terms',
  cookiePolicy: '/cookie-policy',
  instructors: {
    list: '/instructors',
    detail: (slug: string) => `/instructors/${slug}`,
  },
  courses: {
    list: '/courses',
    detail: (slug: string) => `/courses/${slug}`,
  },
  categories: {
    list: '/categories',
    detail: (slug: string) => `/categories/${slug}`,
  },
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    googleCallback: '/auth/google/callback',
    unauthorized: '/unauthorized',
  },
  dashboard: {
    root: '/dashboard',
    courses: '/dashboard/courses',
    profile: '/dashboard/profile',
    settings: '/dashboard/settings',
  },
  admin: {
    root: '/admin/dashboard',
  },
} as const;
