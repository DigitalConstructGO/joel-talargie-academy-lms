import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface CourseProgressCardProps {
  href: string;
  thumbnailSrc: string;
  category: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  className?: string;
}

/** A "my courses" list row - thumbnail, category, lesson count, and a progress bar (or a completed badge at 100%). */
export function CourseProgressCard({
  href,
  thumbnailSrc,
  category,
  title,
  completedLessons,
  totalLessons,
  className,
}: CourseProgressCardProps) {
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isComplete = percent >= 100;

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-primary/30',
        className,
      )}
    >
      <div className="size-20 shrink-0 overflow-hidden rounded-xl">
        <Image
          src={thumbnailSrc}
          alt=""
          width={80}
          height={80}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <Badge variant="secondary" className="uppercase tracking-wide">
            {category}
          </Badge>
          <span className="shrink-0 text-xs text-muted-foreground">
            {completedLessons}/{totalLessons} Lessons
          </span>
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
