import type { Metadata } from 'next';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { HeroSection } from '@/features/home/components/hero-section';
import { StatsSection } from '@/features/home/components/stats-section';
import { CategoriesSection } from '@/features/home/components/categories-section';
import { FeaturedCoursesSection } from '@/features/home/components/featured-courses-section';
import { WhyChooseUsSection } from '@/features/home/components/why-choose-us-section';
import { HowItWorksSection } from '@/features/home/components/how-it-works-section';
import { PricingPreviewSection } from '@/features/home/components/pricing-preview-section';
import { FaqPreviewSection } from '@/features/home/components/faq-preview-section';
import { CtaBannerSection } from '@/features/home/components/cta-banner-section';

export const metadata: Metadata = {
  title: 'Joel Talargie Academy - Learn with purpose. Build with confidence.',
  description:
    'Explore a growing catalog of self-paced courses across a range of categories, taught by real instructors.',
};

async function loadHomeData() {
  try {
    const [categories, featured, courseSample, freeCourses] = await Promise.all([
      catalogApi.listCategories({ pageSize: 4 }),
      catalogApi.featuredCourses({ pageSize: 8 }),
      catalogApi.listCourses({ pageSize: 100 }),
      catalogApi.listCourses({ pageSize: 1, accessType: 'FREE' }),
    ]);
    const instructorCount = new Set(courseSample.items.map((course) => course.presenterName)).size;
    return {
      categories: categories.items,
      featured: featured.items,
      stats: {
        totalCourses: courseSample.total,
        totalCategories: categories.total,
        freeCourses: freeCourses.total,
        instructorCount,
      },
    };
  } catch {
    return {
      categories: [],
      featured: [],
      stats: { totalCourses: 0, totalCategories: 0, freeCourses: 0, instructorCount: 0 },
    };
  }
}

export default async function Home() {
  const { categories, featured, stats } = await loadHomeData();

  return (
    <main>
      <HeroSection />
      <StatsSection stats={stats} />
      <CategoriesSection categories={categories} />
      <FeaturedCoursesSection courses={featured} />
      <WhyChooseUsSection />
      <HowItWorksSection />
      <PricingPreviewSection />
      <FaqPreviewSection />
      <CtaBannerSection />
    </main>
  );
}
