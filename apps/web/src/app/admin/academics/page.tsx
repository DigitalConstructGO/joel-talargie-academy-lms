'use client';

import { BookOpen, GraduationCap, Layers, UserCog } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { Reveal } from '@/components/common/reveal';
import { StatCard } from '@/components/dashboard/stat-card';
import { QuickActionCard } from '@/components/dashboard/quick-action-card';
import { useDashboardOverview } from '@/features/dashboard/hooks/use-dashboard';
import { useAdminCategories } from '@/features/catalog/hooks/use-admin-categories';
import { ROUTES } from '@/constants/routes';

const QUICK_LINKS = [
  {
    icon: BookOpen,
    label: 'Courses',
    description: 'Create and manage courses',
    href: ROUTES.admin.academicsCourses,
  },
  {
    icon: Layers,
    label: 'Categories',
    description: 'Organize the course catalog',
    href: ROUTES.admin.academicsCategories,
  },
  {
    icon: UserCog,
    label: 'Instructors',
    description: 'See who is presenting your courses',
    href: ROUTES.admin.academicsInstructors,
  },
  {
    icon: GraduationCap,
    label: 'Enrollments',
    description: 'Every student enrollment',
    href: ROUTES.admin.academicsEnrollments,
  },
];

import { useLanguage } from '@/lib/i18n/language-provider';

export default function AdminAcademicsPage() {
  const { t } = useLanguage();
  const overviewQuery = useDashboardOverview();
  const categoriesQuery = useAdminCategories({ pageSize: 1 });

  const quickLinks = [
    {
      icon: BookOpen,
      label: t('nav.courses'),
      description: 'Create and manage courses',
      href: ROUTES.admin.academicsCourses,
    },
    {
      icon: Layers,
      label: t('nav.categories'),
      description: 'Organize the course catalog',
      href: ROUTES.admin.academicsCategories,
    },
    {
      icon: UserCog,
      label: t('nav.instructors'),
      description: 'See who is presenting your courses',
      href: ROUTES.admin.academicsInstructors,
    },
    {
      icon: GraduationCap,
      label: t('dashboard.enrolledCourses'),
      description: 'Every student enrollment',
      href: ROUTES.admin.academicsEnrollments,
    },
  ];

  return (
    <ContentContainer>
      <PageHeader title={t('sidebar.academics')} description={t('categories.subtitle')} />

      <Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label={t('nav.courses')}
            value={
              overviewQuery.data?.kpis?.courses?.published ?? (overviewQuery.isLoading ? '—' : 0)
            }
            suffix={
              overviewQuery.data?.kpis?.courses
                ? `/ ${overviewQuery.data.kpis.courses.total}`
                : undefined
            }
            tone="primary"
          />
          <StatCard
            icon={Layers}
            label={t('nav.categories')}
            value={categoriesQuery.data?.total ?? (categoriesQuery.isLoading ? '—' : 0)}
            tone="info"
          />
          <StatCard
            icon={GraduationCap}
            label={t('dashboard.activeCourses')}
            value={
              overviewQuery.data?.kpis?.enrollments?.active ?? (overviewQuery.isLoading ? '—' : 0)
            }
            tone="teal"
          />
          <StatCard
            icon={GraduationCap}
            label={t('dashboard.completedCourses')}
            value={
              overviewQuery.data?.kpis?.enrollments?.completed ??
              (overviewQuery.isLoading ? '—' : 0)
            }
            tone="success"
          />
        </div>
      </Reveal>

      <Reveal delaySeconds={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <QuickActionCard key={link.label} {...link} />
          ))}
        </div>
      </Reveal>
    </ContentContainer>
  );
}
