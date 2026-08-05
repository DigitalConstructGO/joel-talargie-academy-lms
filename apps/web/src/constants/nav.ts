import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
} from 'lucide-react';
import { ROUTES } from './routes';
import type { NavSection } from '@/types';

export const STUDENT_NAV: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: ROUTES.dashboard.root, icon: LayoutDashboard },
      { label: 'My Courses', href: ROUTES.dashboard.courses, icon: BookOpen },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', href: ROUTES.dashboard.profile, icon: UserCircle },
      { label: 'Settings', href: ROUTES.dashboard.settings, icon: Settings },
    ],
  },
];

export const ADMIN_NAV: NavSection[] = [
  {
    items: [{ label: 'Overview', href: ROUTES.admin.root, icon: LayoutDashboard }],
  },
  {
    label: 'Academy',
    items: [
      { label: 'Courses', href: '#', icon: GraduationCap, permission: 'catalog.read' },
      { label: 'Students', href: '#', icon: Users, permission: 'users.read' },
      {
        label: 'Administration',
        href: '#',
        icon: ShieldCheck,
        permission: 'roles.read',
        items: [
          { label: 'Roles', href: '#', permission: 'roles.read' },
          { label: 'Permissions', href: '#', permission: 'permissions.read' },
        ],
      },
    ],
  },
];
