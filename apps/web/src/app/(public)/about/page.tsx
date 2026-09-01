import type { Metadata } from 'next';
import { Award, BookOpen, Compass, Handshake, Heart, Lightbulb, Target, Users } from 'lucide-react';
import { Reveal } from '@/components/common/reveal';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { StatsSection } from '@/features/home/components/stats-section';
import { CtaBannerSection } from '@/features/home/components/cta-banner-section';
import { FeatureCard } from '@/components/marketing/feature-card';
import { Timeline } from '@/components/marketing/timeline';
import { Card } from '@/components/ui/card';
import { siteConfig } from '@/config/site.config';
import { LEADERSHIP_TEAM } from '@/features/about/data/leadership-team.data';

export const metadata: Metadata = {
  title: 'About Us',
  description: `Learn about ${siteConfig.name} and our mission.`,
};

const CORE_VALUES = [
  {
    icon: Target,
    title: 'Outcomes over hours',
    description:
      'We measure success by what students can actually do, not just how many hours of video they watched.',
  },
  {
    icon: Heart,
    title: 'Students first',
    description:
      'Every product and content decision starts with what genuinely helps students learn and finish.',
  },
  {
    icon: Lightbulb,
    title: 'Practical over theoretical',
    description:
      'Courses are built around real projects and real problems, not abstract theory disconnected from practice.',
  },
  {
    icon: Handshake,
    title: 'Instructor quality',
    description:
      'Every instructor is vetted for real-world experience, not just presentation skills.',
  },
];

const TIMELINE = [
  {
    year: 'Year 1',
    title: 'The academy is founded',
    description:
      'Started with a small catalog and a simple goal: make high-quality, practical education accessible online.',
  },
  {
    year: 'Year 2',
    title: 'Instructor network grows',
    description:
      'Expanded to a global network of industry instructors across engineering, design, data, and business.',
  },
  {
    year: 'Year 3',
    title: 'Certificates launched',
    description:
      'Introduced certificates of completion so students could show what they learned to employers.',
  },
  {
    year: 'Today',
    title: 'A growing course catalog',
    description:
      'Courses spanning web development, cloud, security, data, design, and business, taught by real practitioners.',
  },
];

async function loadStats() {
  try {
    const [categories, courseSample] = await Promise.all([
      catalogApi.listCategories({ pageSize: 1 }),
      catalogApi.listCourses({ pageSize: 100 }),
    ]);
    return {
      totalCourses: courseSample.total,
      totalCategories: categories.total,
      instructorCount: new Set(courseSample.items.map((course) => course.presenterName)).size,
    };
  } catch {
    return {
      totalCourses: 12,
      totalCategories: 4,
      instructorCount: 6,
    };
  }
}

import { AboutPageContent } from '@/features/about/components/about-page-content';

export default async function AboutPage() {
  const stats = await loadStats();
  return <AboutPageContent stats={stats} />;
}
