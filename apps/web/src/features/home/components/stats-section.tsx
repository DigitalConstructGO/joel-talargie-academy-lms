import { BookOpen, Layers, Gift, Users } from 'lucide-react';
import { StatCard } from '@/components/common/stat-card';
import { formatCompactNumber } from '@/lib/format';

export interface HomeStats {
  totalCourses: number;
  totalCategories: number;
  freeCourses: number;
  instructorCount: number;
}

export function StatsSection({ stats }: { stats: HomeStats }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Courses available"
          value={formatCompactNumber(stats.totalCourses)}
        />
        <StatCard
          icon={Layers}
          label="Categories"
          value={formatCompactNumber(stats.totalCategories)}
        />
        <StatCard icon={Gift} label="Free courses" value={formatCompactNumber(stats.freeCourses)} />
        <StatCard
          icon={Users}
          label="Instructors"
          value={formatCompactNumber(stats.instructorCount)}
        />
      </div>
    </section>
  );
}
