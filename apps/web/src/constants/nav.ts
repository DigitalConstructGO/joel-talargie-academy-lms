import {
  Activity,
  Award,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Compass,
  CreditCard,
  GraduationCap,
  Heart,
  KeyRound,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  Mail,
  MessageSquare,
  Settings,
  ShieldCheck,
  Tag,
  UserCircle,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import { ROUTES } from './routes';
import type { NavSection } from '@/types';

export const STUDENT_NAV: NavSection[] = [
  {
    label: 'Main Menu',
    items: [
      { label: 'Dashboard', href: ROUTES.dashboard.root, icon: LayoutDashboard },
      { label: 'Browse Courses', href: ROUTES.dashboard.browseCourses, icon: Compass },
      { label: 'My Courses', href: ROUTES.dashboard.courses, icon: BookOpen },
      { label: 'Wishlist', href: ROUTES.dashboard.wishlist, icon: Heart },
      { label: 'Certificates', href: ROUTES.dashboard.certificates, icon: Award },
      { label: 'Verify Certificate', href: ROUTES.dashboard.verifyCertificate, icon: BadgeCheck },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Payments', href: ROUTES.dashboard.payments, icon: CreditCard },
      { label: 'Notifications', href: ROUTES.dashboard.notifications, icon: Bell },
      {
        label: 'Support',
        href: ROUTES.dashboard.support,
        icon: LifeBuoy,
        disabled: true,
        badge: { label: 'Soon', variant: 'warning' },
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Profile', href: ROUTES.dashboard.profile, icon: UserCircle },
      { label: 'Security', href: ROUTES.dashboard.security, icon: KeyRound },
      { label: 'Settings', href: ROUTES.dashboard.settings, icon: Settings },
    ],
  },
];

export const ADMIN_NAV: NavSection[] = [
  {
    items: [{ label: 'Dashboard', href: ROUTES.admin.root, icon: LayoutDashboard }],
  },
  {
    label: 'Management',
    items: [
      {
        label: 'User Management',
        href: ROUTES.admin.users,
        icon: Users,
        permission: 'users.read',
        items: [
          { label: 'Users', href: ROUTES.admin.users, icon: Users, permission: 'users.read' },
          {
            label: 'Roles',
            href: ROUTES.admin.systemRoles,
            icon: ShieldCheck,
            permission: 'roles.read',
          },
          {
            label: 'Permissions',
            href: ROUTES.admin.systemPermissions,
            icon: KeyRound,
            permission: 'permissions.read',
          },
        ],
      },
      {
        label: 'Academic Management',
        href: ROUTES.admin.academics,
        icon: GraduationCap,
        // 'catalog.read' does not exist on the backend (verified against
        // every real @RequirePermissions() string) - courses.read is the
        // closest real permission covering this whole area.
        permission: 'courses.read',
        items: [
          {
            label: 'Courses',
            href: ROUTES.admin.academicsCourses,
            icon: BookOpen,
            permission: 'courses.read',
          },
          {
            label: 'Categories',
            href: ROUTES.admin.academicsCategories,
            icon: Layers,
            permission: 'categories.read',
          },
          {
            label: 'Instructors',
            href: ROUTES.admin.academicsInstructors,
            icon: UserCog,
            // No dedicated instructor permission exists on the backend -
            // instructor management is part of course content management.
            permission: 'courses.read',
          },
          {
            label: 'Enrollments',
            href: ROUTES.admin.academicsEnrollments,
            icon: GraduationCap,
            permission: 'enrollments.read',
          },
        ],
      },
      {
        label: 'Financial Management',
        href: ROUTES.admin.financial,
        icon: Wallet,
        permission: 'payments.read',
        items: [
          {
            label: 'Payments',
            href: ROUTES.admin.financialPayments,
            icon: CreditCard,
            permission: 'payments.read',
          },
          {
            label: 'Campaigns',
            href: ROUTES.admin.financialPromotions,
            icon: Tag,
            permission: 'promotions.read',
          },
          {
            label: 'Promo Codes',
            href: ROUTES.admin.financialPromoCodes,
            icon: Tag,
            permission: 'promotions.read',
          },
        ],
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Certificate Management',
        href: ROUTES.admin.certificates,
        icon: Award,
        permission: 'certificates.read',
      },
      {
        label: 'Verify Certificate',
        href: ROUTES.admin.verifyCertificate,
        icon: BadgeCheck,
      },
      {
        label: 'Communication',
        href: ROUTES.admin.communication,
        icon: MessageSquare,
        permission: 'notifications.read',
        items: [
          {
            label: 'Notifications',
            href: ROUTES.admin.communicationNotifications,
            icon: Bell,
            permission: 'notifications.read',
          },
          {
            label: 'Email Templates',
            href: ROUTES.admin.communicationEmailTemplates,
            icon: Mail,
            permission: 'notifications.read',
          },
          {
            label: 'Support',
            href: ROUTES.admin.communicationSupport,
            icon: LifeBuoy,
            disabled: true,
            badge: { label: 'Soon', variant: 'warning' },
          },
        ],
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        label: 'Reports & Analytics',
        href: ROUTES.admin.reports,
        icon: BarChart3,
        permission: 'reports.read',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        label: 'System',
        href: ROUTES.admin.system,
        icon: ShieldCheck,
        permission: 'settings.read',
        items: [
          {
            label: 'Activity Logs',
            href: ROUTES.admin.systemActivityLogs,
            icon: Activity,
            permission: 'audit.read',
          },
          {
            label: 'Academy Settings',
            href: ROUTES.admin.systemAcademySettings,
            icon: Settings,
            permission: 'settings.read',
          },
          // Profile/Security are self-service (any authenticated staff
          // member manages their own) - no permission gate, same as the
          // student portal's equivalents.
          { label: 'Profile', href: ROUTES.admin.systemProfile, icon: UserCircle },
          { label: 'Security', href: ROUTES.admin.systemSecurity, icon: KeyRound },
        ],
      },
    ],
  },
];
