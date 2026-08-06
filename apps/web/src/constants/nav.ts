import {
  Award,
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
  MessageSquare,
  Settings,
  ShieldCheck,
  ShoppingCart,
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
    items: [{ label: 'Dashboard', href: ROUTES.dashboard.root, icon: LayoutDashboard }],
  },
  {
    label: 'Learning',
    items: [
      { label: 'Browse Courses', href: ROUTES.courses.list, icon: Compass },
      { label: 'My Courses', href: ROUTES.dashboard.courses, icon: BookOpen },
      { label: 'Wishlist', href: ROUTES.dashboard.wishlist, icon: Heart },
      { label: 'Certificates', href: ROUTES.dashboard.certificates, icon: Award },
    ],
  },
  {
    label: 'Billing',
    items: [
      { label: 'Checkout', href: ROUTES.dashboard.checkout, icon: ShoppingCart },
      { label: 'Payments', href: ROUTES.dashboard.payments, icon: CreditCard },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Notifications', href: ROUTES.dashboard.notifications, icon: Bell },
      { label: 'Support', href: ROUTES.dashboard.support, icon: LifeBuoy },
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
      { label: 'User Management', href: ROUTES.admin.users, icon: Users, permission: 'users.read' },
      {
        label: 'Academic Management',
        href: ROUTES.admin.academics,
        icon: GraduationCap,
        permission: 'catalog.read',
        items: [
          {
            label: 'Courses',
            href: ROUTES.admin.academicsCourses,
            icon: BookOpen,
            permission: 'catalog.read',
          },
          {
            label: 'Categories',
            href: ROUTES.admin.academicsCategories,
            icon: Layers,
            permission: 'catalog.read',
          },
          {
            label: 'Instructors',
            href: ROUTES.admin.academicsInstructors,
            icon: UserCog,
            permission: 'catalog.read',
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
            label: 'Promotions',
            href: ROUTES.admin.financialPromotions,
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
        label: 'Communication',
        href: ROUTES.admin.communication,
        icon: MessageSquare,
        permission: 'notifications.read',
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
        permission: 'roles.read',
        items: [
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
    ],
  },
];
