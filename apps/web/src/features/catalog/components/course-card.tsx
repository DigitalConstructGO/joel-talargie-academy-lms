import Link from 'next/link';
import { Clock, Signal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDurationMinutes } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { CourseThumbnail } from './course-thumbnail';
import { PriceTag } from './price-tag';
import { WishlistButton } from './wishlist-button';
import { DIFFICULTY_LABELS } from '../constants/catalog.constants';
import type { CourseSummary } from '../types/catalog.types';

export interface CourseCardProps {
  course: CourseSummary;
  className?: string;
  view?: 'grid' | 'list';
}

export function CourseCard({ course, className, view = 'grid' }: CourseCardProps) {
  const href = ROUTES.courses.detail(course.slug);

  if (view === 'list') {
    return (
      <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', className)}>
        <Link href={href} className="flex flex-col gap-4 sm:flex-row">
          <CourseThumbnail
            title={course.title}
            categoryName={course.categoryName}
            className="w-full rounded-t-xl sm:w-56 sm:rounded-l-xl sm:rounded-tr-none"
          />
          <div className="flex flex-1 flex-col gap-2 p-4 pt-0 sm:pt-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{course.title}</h3>
              <WishlistButton courseId={course.id} courseTitle={course.title} />
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">{course.shortDescription}</p>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Signal className="size-3.5" /> {DIFFICULTY_LABELS[course.difficulty]}
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
          <CourseThumbnail title={course.title} categoryName={course.categoryName} />
          <WishlistButton
            courseId={course.id}
            courseTitle={course.title}
            className="absolute right-2 top-2"
          />
          {course.featured && (
            <Badge className="absolute left-2 top-2 bg-brand text-brand-foreground">Featured</Badge>
          )}
        </div>
        <CardContent className="flex flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-brand">
            {course.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.shortDescription}</p>
          <p className="text-xs text-muted-foreground">by {course.presenterName}</p>
          <div className="flex items-center justify-between pt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Signal className="size-3.5" /> {DIFFICULTY_LABELS[course.difficulty]}
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
