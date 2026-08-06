/**
 * Central route path constants. Prefer these over hardcoded string literals
 * so a path change only needs to happen in one place - notably the same
 * `/auth`, `/admin`, `/dashboard` segments enforced by `src/middleware.ts`.
 */
export const ROUTES = {
  home: '/',
  health: '/health',
  forbidden: '/403',
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
    wishlist: '/dashboard/wishlist',
    checkout: '/dashboard/checkout',
    certificates: '/dashboard/certificates',
    payments: '/dashboard/payments',
    notifications: '/dashboard/notifications',
    support: '/dashboard/support',
    profile: '/dashboard/profile',
    security: '/dashboard/security',
    settings: '/dashboard/settings',
  },
  admin: {
    root: '/admin/dashboard',
    users: '/admin/users',
    academics: '/admin/academics',
    academicsCourses: '/admin/academics/courses',
    academicsCategories: '/admin/academics/categories',
    academicsInstructors: '/admin/academics/instructors',
    financial: '/admin/financial',
    financialPayments: '/admin/financial/payments',
    financialPromotions: '/admin/financial/promotions',
    certificates: '/admin/certificates',
    communication: '/admin/communication',
    reports: '/admin/reports',
    system: '/admin/system',
    systemRoles: '/admin/system/roles',
    systemPermissions: '/admin/system/permissions',
  },
} as const;
