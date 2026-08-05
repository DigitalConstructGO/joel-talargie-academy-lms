import type { Metadata } from 'next';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { StatsSection } from '@/features/home/components/stats-section';
import { WhyChooseUsSection } from '@/features/home/components/why-choose-us-section';
import { CtaBannerSection } from '@/features/home/components/cta-banner-section';
import { siteConfig } from '@/config/site.config';

export const metadata: Metadata = {
  title: 'About Us',
  description: `Learn about ${siteConfig.name} and our mission.`,
};

async function loadStats() {
  try {
    const [categories, courseSample, freeCourses] = await Promise.all([
      catalogApi.listCategories({ pageSize: 1 }),
      catalogApi.listCourses({ pageSize: 100 }),
      catalogApi.listCourses({ pageSize: 1, accessType: 'FREE' }),
    ]);
    const instructorCount = new Set(courseSample.items.map((course) => course.presenterName)).size;
    return {
      totalCourses: courseSample.total,
      totalCategories: categories.total,
      freeCourses: freeCourses.total,
      instructorCount,
    };
  } catch {
    return { totalCourses: 0, totalCategories: 0, freeCourses: 0, instructorCount: 0 };
  }
}

export default async function AboutPage() {
  const stats = await loadStats();

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-brand/5 via-background to-background">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            About {siteConfig.name}
          </h1>
          <p className="text-lg text-muted-foreground">
            {siteConfig.description} We build a straightforward, self-paced learning platform where
            instructors publish real courses and learners make steady progress at their own speed.
          </p>
        </div>
      </section>

      <StatsSection stats={stats} />
      <WhyChooseUsSection />
      <CtaBannerSection />
    </div>
  );
}
