import { Quote, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Testimonial } from '../types/testimonial.types';

export function TestimonialCard({
  testimonial,
  className,
}: {
  testimonial: Testimonial;
  className?: string;
}) {
  const initials = testimonial.studentName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');

  return (
    <Card className={cn('flex h-full flex-col gap-4 p-6', className)}>
      <Quote className="size-6 text-brand/40" aria-hidden="true" />
      <p className="flex-1 text-sm leading-relaxed text-foreground">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="flex items-center gap-1" aria-label={`${testimonial.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn(
              'size-3.5',
              index < testimonial.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30',
            )}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-border pt-4">
        {testimonial.avatarUrl ? (
          <img
            src={testimonial.avatarUrl}
            alt={testimonial.studentName}
            className="size-10 shrink-0 rounded-full object-cover border border-border"
          />
        ) : (
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold text-white',
              testimonial.avatarColor,
            )}
          >
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {testimonial.studentName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    </Card>
  );
}
