'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { CourseCard } from '@/features/catalog/components/course-card';
import { ROUTES } from '@/constants/routes';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { CourseSummary } from '@/features/catalog/types/catalog.types';

export function FeaturedCoursesSection({ courses }: { courses: CourseSummary[] }) {
  const { t } = useLanguage();

  return (
    <section className="border-t border-border bg-muted/20">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('featured.title')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('featured.subtitle')}
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={ROUTES.courses.list}>
              {t('featured.browseAll')}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={t('featured.empty')}
            description=""
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
