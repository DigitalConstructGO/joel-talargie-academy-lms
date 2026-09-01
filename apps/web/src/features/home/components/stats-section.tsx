'use client';

import { Award, BookOpen, Layers, ThumbsUp, Users } from 'lucide-react';
import { StatCard } from '@/components/common/stat-card';
import { AnimatedCounter } from '@/components/common/animated-counter';
import { formatCompactNumber } from '@/lib/format';

export interface HomeStats {
  totalCourses: number;
  totalCategories: number;
  instructorCount: number;
  studentsEnrolled?: number;
  satisfactionPercent?: number;
  certificatesIssued?: number;
}

import { useLanguage } from '@/lib/i18n/language-provider';

export interface HomeStats {
  totalCourses: number;
  totalCategories: number;
  instructorCount: number;
  studentsEnrolled?: number;
  satisfactionPercent?: number;
  certificatesIssued?: number;
}

export function StatsSection({ stats }: { stats: HomeStats }) {
  const { t } = useLanguage();
  const hasPlatformStats =
    stats.studentsEnrolled !== undefined &&
    stats.satisfactionPercent !== undefined &&
    stats.certificatesIssued !== undefined;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div
        className={
          hasPlatformStats
            ? 'grid grid-cols-2 gap-4 lg:grid-cols-6'
            : 'grid grid-cols-2 gap-4 lg:grid-cols-3'
        }
      >
        {hasPlatformStats && (
          <StatCard
            icon={Users}
            label={t('stats.students')}
            value={<AnimatedCounter value={stats.studentsEnrolled!} format={formatCompactNumber} />}
          />
        )}
        <StatCard
          icon={BookOpen}
          label={t('nav.courses')}
          value={<AnimatedCounter value={stats.totalCourses} format={formatCompactNumber} />}
        />
        <StatCard
          icon={Layers}
          label={t('nav.categories')}
          value={<AnimatedCounter value={stats.totalCategories} format={formatCompactNumber} />}
        />
        <StatCard
          icon={Users}
          label={t('nav.instructors')}
          value={<AnimatedCounter value={stats.instructorCount} format={formatCompactNumber} />}
        />
        {hasPlatformStats && (
          <>
            <StatCard
              icon={ThumbsUp}
              label={t('stats.satisfaction')}
              value={<AnimatedCounter value={stats.satisfactionPercent!} format={(v) => `${v}%`} />}
            />
            <StatCard
              icon={Award}
              label={t('sidebar.certificates')}
              value={
                <AnimatedCounter value={stats.certificatesIssued!} format={formatCompactNumber} />
              }
            />
          </>
        )}
      </div>
    </section>
  );
}
