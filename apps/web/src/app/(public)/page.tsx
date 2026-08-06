import type { Metadata } from 'next';
import { Reveal } from '@/components/common/reveal';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { computePlatformStats } from '@/features/home/utils/compute-platform-stats';
import { getInstructorBySlug } from '@/features/instructors/data/mock-instructors.data';
import type { InstructorProfile } from '@/features/instructors/types/instructor.types';
import { HeroSection } from '@/features/home/components/hero-section';
import { ValuePillsSection } from '@/features/home/components/value-pills-section';
import { WhyChooseUsSection } from '@/features/home/components/why-choose-us-section';
import { HowItWorksSection } from '@/features/home/components/how-it-works-section';
import { FeaturedCoursesSection } from '@/features/home/components/featured-courses-section';
import { MentorSpotlightSection } from '@/features/home/components/mentor-spotlight-section';
import { StatsBandSection } from '@/features/home/components/stats-band-section';
import { TestimonialsSection } from '@/features/testimonials/components/testimonials-section';
import { FaqPreviewSection } from '@/features/home/components/faq-preview-section';
import { CtaBannerSection } from '@/features/home/components/cta-banner-section';

export const metadata: Metadata = {
  title: 'Joel Talargie Academy - Learn with purpose. Build with confidence.',
  description:
    'Explore a growing catalog of self-paced courses across a range of categories, taught by real instructors.',
};

async function loadHomeData() {
  try {
    const featured = await catalogApi.featuredCourses({ pageSize: 8 });
    const isMock = CATALOG_DATA_SOURCE === 'mock';

    const topMentor: InstructorProfile | null = isMock
      ? (getInstructorBySlug('joel-talargie') ?? null)
      : null;

    const platformStats = isMock ? computePlatformStats() : null;

    return { featured: featured.items, topMentor, platformStats };
  } catch {
    return { featured: [], topMentor: null, platformStats: null };
  }
}

export default async function Home() {
  const { featured, topMentor, platformStats } = await loadHomeData();

  return (
    <main>
      <HeroSection />
      <ValuePillsSection />
      <Reveal>
        <WhyChooseUsSection />
      </Reveal>
      <Reveal>
        <HowItWorksSection />
      </Reveal>
      <Reveal>
        <FeaturedCoursesSection courses={featured} />
      </Reveal>
      <Reveal>
        <MentorSpotlightSection instructor={topMentor} />
      </Reveal>
      {platformStats && (
        <Reveal>
          <StatsBandSection
            items={[
              { value: platformStats.studentsEnrolled, label: 'Students enrolled', kind: 'count' },
              {
                value: platformStats.averageRating,
                label: 'Average course rating',
                kind: 'rating',
              },
              {
                value: platformStats.satisfactionPercent,
                label: 'Student satisfaction',
                kind: 'percent',
              },
            ]}
          />
        </Reveal>
      )}
      <Reveal>
        <TestimonialsSection />
      </Reveal>
      <Reveal>
        <FaqPreviewSection />
      </Reveal>
      <Reveal>
        <CtaBannerSection />
      </Reveal>
    </main>
  );
}
