import { Award, CheckCircle2, Clock, Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DIFFICULTY_LABELS } from '@/features/catalog/constants/catalog.constants';
import type { CourseDetail } from '@/features/catalog/types/catalog.types';
import { formatDurationMinutes } from '@/lib/format';

interface CourseSummaryStepProps {
  course: CourseDetail;
  onNext: () => void;
}

export function CourseSummaryStep({ course, onNext }: CourseSummaryStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">You&apos;re enrolling in</h2>
        <p className="mt-1 text-2xl font-bold text-foreground">{course.title}</p>
        {course.subtitle && <p className="mt-1 text-sm text-muted-foreground">{course.subtitle}</p>}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <Signal className="size-4" /> {DIFFICULTY_LABELS[course.difficulty]} level
        </span>
        {course.estimatedDurationMinutes && (
          <span className="flex items-center gap-2">
            <Clock className="size-4" /> {formatDurationMinutes(course.estimatedDurationMinutes)}{' '}
            total
          </span>
        )}
        {course.certificateEnabled && (
          <span className="flex items-center gap-2">
            <Award className="size-4" /> Certificate of completion
          </span>
        )}
      </div>

      {course.outcomes.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-bold text-foreground">What you&apos;ll get</h3>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {course.outcomes.slice(0, 8).map((outcome) => (
                <li key={outcome} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button size="lg" className="w-full sm:w-auto" onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
