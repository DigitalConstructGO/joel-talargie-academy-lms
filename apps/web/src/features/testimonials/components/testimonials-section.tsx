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

export function TestimonialsSection() {
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
          {MOCK_TESTIMONIALS.map((testimonial) => (
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
