import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { HeroSkeleton } from './hero-skeleton';
import { NumberedStepsSkeleton } from './numbered-steps-skeleton';
import { StatsBandSkeleton } from './stats-band-skeleton';
import { CtaBannerSkeleton } from './cta-banner-skeleton';
import { SectionPlaceholderSkeleton } from './section-placeholder-skeleton';
import { CoursesGridSkeleton } from '@/features/catalog/components/course-card-skeleton';
import { CategoryGridSkeleton } from '@/features/catalog/components/category-card-skeleton';

/** Mirrors `features/home/components/categories-section.tsx`. */
function CategoriesPreviewSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="hidden h-9 w-24 sm:block" />
      </div>
      <CategoryGridSkeleton count={4} />
    </section>
  );
}

/** Mirrors `features/home/components/pricing-preview-section.tsx`. */
function PricingPreviewSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Card key={index} className="flex flex-col gap-3 p-6">
            <Skeleton className="size-11 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Skeleton className="h-11 w-56" />
      </div>
    </section>
  );
}

/**
 * Mirrors `app/(public)/page.tsx`'s exact section order. Sections that carry
 * the most above-the-fold/CLS weight (Hero, HowItWorks, FeaturedCourses,
 * Categories, StatsBand, PricingPreview, CtaBanner) are mirrored faithfully;
 * the remaining marketing-copy sections (ValuePills, WhyChooseUs,
 * MentorSpotlight, Testimonials, FaqPreview) use a generic placeholder sized
 * to a representative section height, since this fallback only ever paints
 * on a session's first navigation to `/`.
 */
export function HomePageSkeleton() {
  return (
    <main>
      <HeroSkeleton />
      <SectionPlaceholderSkeleton cards={4} />
      <SectionPlaceholderSkeleton cards={3} bordered />
      <NumberedStepsSkeleton />
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <CoursesGridSkeleton count={8} />
      </section>
      <CategoriesPreviewSkeleton />
      <SectionPlaceholderSkeleton cards={1} bordered />
      <StatsBandSkeleton />
      <PricingPreviewSkeleton />
      <SectionPlaceholderSkeleton cards={3} />
      <SectionPlaceholderSkeleton cards={2} bordered />
      <CtaBannerSkeleton />
    </main>
  );
}
