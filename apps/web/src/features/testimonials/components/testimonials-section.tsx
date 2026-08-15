'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { TestimonialCard } from './testimonial-card';
import { MOCK_TESTIMONIALS } from '../data/mock-testimonials.data';
import type { TestimonialItem } from '@/features/settings/types/settings.types';
import type { Testimonial } from '../types/testimonial.types';

const COLORS = [
  'from-emerald-500 to-emerald-700',
  'from-blue-500 to-indigo-700',
  'from-amber-500 to-amber-700',
  'from-purple-500 to-purple-700',
  'from-rose-500 to-rose-700',
];

export function TestimonialsSection({
  testimonials,
}: {
  testimonials?: TestimonialItem[];
}) {
  const items: Testimonial[] =
    testimonials && testimonials.length > 0
      ? testimonials.map((t, idx) => ({
          id: t.id,
          studentName: t.studentName,
          role: t.courseTitle || 'Academy Graduate',
          courseTitle: t.courseTitle || 'Full-Stack Web Development',
          quote: t.testimonial,
          rating: t.rating ?? 5,
          avatarColor: COLORS[idx % COLORS.length] ?? 'from-emerald-500 to-emerald-700',
        }))
      : MOCK_TESTIMONIALS;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Engineered Success
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real feedback from learners who completed our courses.
          </p>
        </div>
      </div>
      <Carousel opts={{ align: 'start', loop: true }}>
        <CarouselContent>
          {items.map((testimonial) => (
            <CarouselItem key={testimonial.id} className="sm:basis-1/2 lg:basis-1/3">
              <TestimonialCard testimonial={testimonial} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-6 flex items-center justify-center gap-2">
          <CarouselPrevious className="static translate-y-0" />
          <CarouselNext className="static translate-y-0" />
        </div>
      </Carousel>
    </section>
  );
}
