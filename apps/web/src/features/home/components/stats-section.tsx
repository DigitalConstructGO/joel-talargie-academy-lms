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

export function StatsSection({ stats }: { stats: HomeStats }) {
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
            label="Students enrolled"
            value={<AnimatedCounter value={stats.studentsEnrolled!} format={formatCompactNumber} />}
          />
        )}
        <StatCard
          icon={BookOpen}
          label="Courses available"
          value={<AnimatedCounter value={stats.totalCourses} format={formatCompactNumber} />}
        />
        <StatCard
          icon={Layers}
          label="Categories"
          value={<AnimatedCounter value={stats.totalCategories} format={formatCompactNumber} />}
        />
        <StatCard
          icon={Users}
          label="Instructors"
          value={<AnimatedCounter value={stats.instructorCount} format={formatCompactNumber} />}
        />
        {hasPlatformStats && (
          <>
            <StatCard
              icon={ThumbsUp}
              label="Student satisfaction"
              value={<AnimatedCounter value={stats.satisfactionPercent!} format={(v) => `${v}%`} />}
            />
            <StatCard
              icon={Award}
              label="Certificates issued"
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
