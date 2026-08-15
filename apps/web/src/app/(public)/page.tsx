import type { Metadata } from 'next';
import { Reveal } from '@/components/common/reveal';
import { getLandingPageDataServer } from '@/features/settings/api/landing.server';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { listCategoriesServer } from '@/features/catalog/api/catalog.server';
import { HeroSection } from '@/features/home/components/hero-section';
import { ValuePillsSection } from '@/features/home/components/value-pills-section';
import { WhyChooseUsSection } from '@/features/home/components/why-choose-us-section';
import { HowItWorksSection } from '@/features/home/components/how-it-works-section';
import { FeaturedCoursesSection } from '@/features/home/components/featured-courses-section';
import { CategoriesSection } from '@/features/home/components/categories-section';
import { MentorSpotlightSection } from '@/features/home/components/mentor-spotlight-section';
import { StatsBandSection } from '@/features/home/components/stats-band-section';
import { PricingPreviewSection } from '@/features/home/components/pricing-preview-section';
import { TestimonialsSection } from '@/features/testimonials/components/testimonials-section';
import { FaqPreviewSection } from '@/features/home/components/faq-preview-section';
import { VerifyCertificateSection } from '@/features/home/components/verify-certificate-section';
import { CtaBannerSection } from '@/features/home/components/cta-banner-section';

export const metadata: Metadata = {
  title: 'Joel Talargie Academy - Learn with purpose. Build with confidence.',
  description:
    'Explore a growing catalog of self-paced courses across a range of categories, taught by real instructors.',
};

export const revalidate = 30; // Revalidate dynamic landing page content every 30s

async function loadHomeData() {
  try {
    const landing = await getLandingPageDataServer();
    if (landing) {
      return {
        sections: landing.sections ?? {},
        hero: landing.hero,
        valuePills: landing.valuePills,
        whyChooseUs: landing.whyChooseUs,
        howItWorks: landing.howItWorks,
        featured: landing.featuredCourses,
        categories: landing.categories,
        topMentor: landing.mentor,
        platformStats: landing.statistics,
        testimonials: landing.testimonials,
        faqs: landing.faqs,
        finalCta: landing.finalCta,
      };
    }

    // Fallback if landing API is unreachable during build
    const [featured, categories] = await Promise.all([
      catalogApi.featuredCourses({ pageSize: 8 }),
      listCategoriesServer(),
    ]);

    return {
      sections: {
        hero: true,
        valuePills: true,
        whyChooseUs: true,
        howItWorks: true,
        featuredCourses: true,
        categories: true,
        mentor: true,
        stats: true,
        pricing: true,
        testimonials: true,
        certificateVerify: true,
        faq: true,
        finalCta: true,
      },
      hero: undefined,
      valuePills: undefined,
      whyChooseUs: undefined,
      howItWorks: undefined,
      featured: featured.items,
      categories: categories.items.slice(0, 8),
      topMentor: {
        id: 'joel-talargie',
        name: 'Joel Talargie',
        headline: 'Founder & Lead Instructor at Joel Talargie Academy',
        bio: 'Seasoned software engineer, systems architect, and educator passionate about empowering African tech talent with rigorous, world-class skills.',
        avatarUrl: null,
      },
      platformStats: {
        studentsEnrolled: 1250,
        totalCourses: 12,
        totalEnrollments: 1420,
        averageRating: 4.9,
        satisfactionPercent: 98,
      },
      testimonials: undefined,
      faqs: undefined,
      finalCta: undefined,
    };
  } catch {
    return {
      sections: {},
      hero: undefined,
      valuePills: undefined,
      whyChooseUs: undefined,
      howItWorks: undefined,
      featured: [],
      categories: [],
      topMentor: null,
      platformStats: null,
      testimonials: undefined,
      faqs: undefined,
      finalCta: undefined,
    };
  }
}

export default async function Home() {
  const {
    sections,
    hero,
    valuePills,
    whyChooseUs,
    howItWorks,
    featured,
    categories,
    topMentor,
    platformStats,
    testimonials,
    faqs,
    finalCta,
  } = await loadHomeData();

  return (
    <main>
      {sections.hero !== false && <HeroSection hero={hero} />}
      {sections.valuePills !== false && <ValuePillsSection items={valuePills} />}
      {sections.whyChooseUs !== false && (
        <Reveal>
          <WhyChooseUsSection items={whyChooseUs} />
        </Reveal>
      )}
      {sections.howItWorks !== false && (
        <Reveal>
          <HowItWorksSection items={howItWorks} />
        </Reveal>
      )}
      {sections.featuredCourses !== false && featured.length > 0 && (
        <Reveal>
          <FeaturedCoursesSection courses={featured as any} />
        </Reveal>
      )}
      {sections.categories !== false && categories.length > 0 && (
        <Reveal>
          <CategoriesSection categories={categories as any} />
        </Reveal>
      )}
      {sections.mentor !== false && (
        <Reveal>
          <MentorSpotlightSection instructor={topMentor} />
        </Reveal>
      )}
      {sections.stats !== false && platformStats && (
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
      {sections.pricing !== false && (
        <Reveal>
          <PricingPreviewSection />
        </Reveal>
      )}
      {sections.testimonials !== false && (
        <Reveal>
          <TestimonialsSection testimonials={testimonials} />
        </Reveal>
      )}
      {sections.certificateVerify !== false && (
        <Reveal>
          <VerifyCertificateSection />
        </Reveal>
      )}
      {sections.faq !== false && (
        <Reveal>
          <FaqPreviewSection items={faqs} />
        </Reveal>
      )}
      {sections.finalCta !== false && (
        <Reveal>
          <CtaBannerSection finalCta={finalCta} />
        </Reveal>
      )}
    </main>
  );
}
