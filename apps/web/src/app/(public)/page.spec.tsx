import { render, screen } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import Home from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/features/settings/api/landing.server', () => ({
  getLandingPageDataServer: vi.fn().mockResolvedValue({
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
    hero: {
      heading: 'Engineer Your Next Career Move.',
      description: 'Learn directly from the source.',
      primaryCtaText: 'Explore Courses',
      primaryCtaUrl: '/courses',
      secondaryCtaText: 'Create Account',
      secondaryCtaUrl: '/auth/register',
      heroImageUrl: '/images/hero/network-abstract.jpg',
      isActive: true,
    },
    valuePills: [],
    whyChooseUs: [],
    howItWorks: [],
    featuredCourses: [],
    categories: [],
    mentor: null,
    statistics: {
      studentsEnrolled: 1250,
      totalCourses: 12,
      totalEnrollments: 1420,
      averageRating: 4.9,
      satisfactionPercent: 98,
    },
    testimonials: [],
    faqs: [],
    finalCta: {
      heading: 'Ready to Start?',
      description: 'Join for free today.',
      ctaText: 'Create your free account',
      ctaUrl: '/auth/register',
      isActive: true,
    },
  }),
}));

vi.mock('@/features/catalog/api/catalog.api', () => ({
  catalogApi: {
    featuredCourses: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}));

vi.mock('@/features/catalog/api/catalog.server', () => ({
  listCategoriesServer: vi.fn().mockResolvedValue({ items: [] }),
}));

it('renders the academy homepage', async () => {
  render(await Home());
  expect(
    screen.getByRole('heading', { name: 'Engineer Your Next Career Move.' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Ready to Start?' })).toBeInTheDocument();
});
