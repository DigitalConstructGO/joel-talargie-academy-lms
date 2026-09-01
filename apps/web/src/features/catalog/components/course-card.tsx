'use client';

import Link from 'next/link';
import { Clock, Signal, Star, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCompactNumber, formatDurationMinutes } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { CourseThumbnail } from './course-thumbnail';
import { PriceTag } from './price-tag';
import { WishlistButton } from './wishlist-button';
import { useLanguage, translateCourseTitle } from '@/lib/i18n/language-provider';
import { DIFFICULTY_LABELS } from '../constants/catalog.constants';
import type { CourseSummary } from '../types/catalog.types';

export interface CourseCardProps {
  course: CourseSummary;
  className?: string;
  view?: 'grid' | 'list';
  /** Overrides the default public `/courses/[slug]` link target, e.g. for the dashboard's own course-detail route. */
  href?: string;
}

function CourseRatingStat({ course }: { course: CourseSummary }) {
  if (course.rating === undefined) return null;
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-foreground">
      <Star className="size-3.5 fill-warning text-warning" />
      {course.rating.toFixed(1)}
      {course.studentsCount !== undefined && (
        <span className="font-normal text-muted-foreground">
          ({formatCompactNumber(course.studentsCount)})
        </span>
      )}
    </span>
  );
}

export function CourseCard({
  course,
  className,
  view = 'grid',
  href: hrefOverride,
}: CourseCardProps) {
  const { t, locale } = useLanguage();
  const href = hrefOverride ?? ROUTES.courses.detail(course.slug);
  const displayTitle = translateCourseTitle(course.title, locale);

  const getDifficultyLabel = (key: string) => {
    switch (key) {
      case 'BEGINNER':
        return t('common.beginner');
      case 'INTERMEDIATE':
        return t('common.intermediate');
      case 'ADVANCED':
        return t('common.advanced');
      case 'ALL_LEVELS':
        return t('common.allLevels');
      default:
        return DIFFICULTY_LABELS[key as keyof typeof DIFFICULTY_LABELS] ?? key;
    }
  };

  if (view === 'list') {
    return (
      <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', className)}>
        <Link href={href} className="flex flex-col gap-4 sm:flex-row">
          <CourseThumbnail
            title={displayTitle}
            categoryName={course.categoryName}
            categorySlug={course.categorySlug}
            thumbnailKey={course.thumbnailKey}
            thumbnailUrl={course.thumbnailUrl}
            className="w-full rounded-t-xl sm:w-56 sm:rounded-l-xl sm:rounded-tr-none"
          />
          <div className="flex flex-1 flex-col gap-2 p-4 pt-0 sm:pt-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{displayTitle}</h3>
              <WishlistButton courseId={course.id} courseTitle={course.title} />
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">{course.shortDescription}</p>
            <p className="text-xs text-muted-foreground">
              {t('catalog.by')} {course.presenterName}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
              <CourseRatingStat course={course} />
              <span className="flex items-center gap-1">
                <Signal className="size-3.5" /> {getDifficultyLabel(course.difficulty)}
              </span>
              {course.estimatedDurationMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />{' '}
                  {formatDurationMinutes(course.estimatedDurationMinutes)}
                </span>
              )}
              <span className="ml-auto">
                <PriceTag
                  accessType={course.accessType}
                  price={course.price}
                  discountPrice={course.discountPrice}
                  currency={course.currency}
                />
              </span>
            </div>
          </div>
        </Link>
      </Card>
    );
  }

  return (
    <Card className={cn('group overflow-hidden transition-shadow hover:shadow-md', className)}>
      <Link href={href}>
        <div className="relative">
          <CourseThumbnail
            title={displayTitle}
            categoryName={course.categoryName}
            categorySlug={course.categorySlug}
            thumbnailKey={course.thumbnailKey}
            thumbnailUrl={course.thumbnailUrl}
          />
          <WishlistButton
            courseId={course.id}
            courseTitle={course.title}
            className="absolute right-2 top-2"
          />
          {course.featured && (
            <Badge className="absolute left-2 top-2 bg-brand text-brand-foreground">
              {t('catalog.featured')}
            </Badge>
          )}
        </div>
        <CardContent className="flex flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-brand">
            {displayTitle}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.shortDescription}</p>
          <p className="text-xs text-muted-foreground">
            {t('catalog.by')} {course.presenterName}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <CourseRatingStat course={course} />
            {course.studentsCount !== undefined && course.rating === undefined && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3.5" /> {formatCompactNumber(course.studentsCount)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Signal className="size-3.5" /> {getDifficultyLabel(course.difficulty)}
            </span>
            <PriceTag
              accessType={course.accessType}
              price={course.price}
              discountPrice={course.discountPrice}
              currency={course.currency}
            />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
