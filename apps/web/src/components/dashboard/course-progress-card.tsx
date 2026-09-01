'use client';

import Link from 'next/link';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CourseThumbnail } from '@/features/catalog/components/course-thumbnail';
import {
  useLanguage,
  translateCategoryName,
  translateCourseTitle,
} from '@/lib/i18n/language-provider';
import { cn } from '@/lib/utils';

export interface CourseProgressCardProps {
  href: string;
  title: string;
  category: string;
  categorySlug?: string;
  thumbnailKey?: string | null;
  thumbnailUrl?: string | null;
  /** Overall completion, 0-100 - real enrollment data only tracks this, not per-lesson state. */
  progressPercent: number;
  completedLessons?: number;
  totalLessons?: number;
  className?: string;
}

export function CourseProgressCard({
  href,
  title,
  category,
  categorySlug,
  thumbnailKey,
  thumbnailUrl,
  progressPercent,
  completedLessons,
  totalLessons,
  className,
}: CourseProgressCardProps) {
  const { t, locale } = useLanguage();
  const percent = Math.min(Math.max(Math.round(progressPercent), 0), 100);
  const isComplete = percent >= 100;

  const displayCategory = translateCategoryName(category, locale);
  const displayTitle = translateCourseTitle(title, locale);

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-primary/30',
        className,
      )}
    >
      <CourseThumbnail
        title={displayTitle}
        categoryName={displayCategory}
        categorySlug={categorySlug}
        thumbnailKey={thumbnailKey}
        thumbnailUrl={thumbnailUrl}
        showBadge={false}
        className="size-20 shrink-0 rounded-xl transition-transform duration-500 group-hover:scale-110"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <Badge variant="secondary" className="uppercase tracking-wide">
            {displayCategory}
          </Badge>
          {completedLessons !== undefined && totalLessons !== undefined && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {completedLessons}/{totalLessons} {t('catalog.lessons')}
            </span>
          )}
        </div>
        <h4 className="mb-3 truncate font-semibold text-foreground">{displayTitle}</h4>
        <Progress value={percent} />
      </div>
      {isComplete ? (
        <Badge className="shrink-0 gap-1 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
          <CheckCircle2 className="size-3.5" />
          {t('dashboard.completedCourses')}
        </Badge>
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
          <ChevronRight className="size-4" />
        </span>
      )}
    </Link>
  );
}
