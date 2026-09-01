import Link from 'next/link';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CourseThumbnail } from '@/features/catalog/components/course-thumbnail';
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
  /**
   * Optional "x/y Lessons" badge. Real enrollment data has no lesson-level
   * completion, so when shown this is an estimate derived from
   * `progressPercent` against the course's total lesson count, not an
   * exact count - omit both to hide the badge entirely.
   */
  completedLessons?: number;
  totalLessons?: number;
  className?: string;
}

/** A "my courses" list row - thumbnail, category, lesson count, and a progress bar (or a completed badge at 100%). */
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
  const percent = Math.min(Math.max(Math.round(progressPercent), 0), 100);
  const isComplete = percent >= 100;

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-primary/30',
        className,
      )}
    >
      <CourseThumbnail
        title={title}
        categoryName={category}
        categorySlug={categorySlug}
        thumbnailKey={thumbnailKey}
        thumbnailUrl={thumbnailUrl}
        showBadge={false}
        className="size-20 shrink-0 rounded-xl transition-transform duration-500 group-hover:scale-110"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <Badge variant="secondary" className="uppercase tracking-wide">
            {category}
          </Badge>
          {completedLessons !== undefined && totalLessons !== undefined && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {completedLessons}/{totalLessons} Lessons
            </span>
          )}
        </div>
        <h4 className="mb-3 truncate font-semibold text-foreground">{title}</h4>
        <Progress value={percent} />
      </div>
      {isComplete ? (
        <Badge className="shrink-0 gap-1 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
          <CheckCircle2 className="size-3.5" />
          Completed
        </Badge>
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
          <ChevronRight className="size-4" />
        </span>
      )}
    </Link>
  );
}
