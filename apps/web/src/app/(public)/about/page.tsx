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

export default async function AboutPage() {
  const stats = await loadStats();

  return (
    <div>
      <section className="border-b border-border bg-linear-to-b from-brand/5 via-background to-background">
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

      <Reveal>
        <StatsSection stats={stats} />
      </Reveal>

      <Reveal>
        <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Our story</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              {siteConfig.name} started from a simple frustration: most online courses either move
              too slowly to be worth the time, or move so fast that they leave real understanding
              behind. We wanted to build something different - courses taught by people who actually
              do the work they teach, organized around outcomes instead of just video runtime.
            </p>
            <p>
              Every course on the platform is built around a clear set of skills a student should
              walk away with, backed by real projects rather than passive watching. That philosophy
              shapes everything from how we vet instructors to how we structure a single lesson.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="border-t border-border bg-muted/20">
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6">
            <Card className="flex flex-col gap-3 p-6">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Compass className="size-5" />
              </span>
              <h3 className="text-lg font-semibold text-foreground">Our mission</h3>
              <p className="text-sm text-muted-foreground">
                Make practical, high-quality education accessible to anyone with the motivation to
                learn, regardless of where they are starting from.
              </p>
            </Card>
            <Card className="flex flex-col gap-3 p-6">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Award className="size-5" />
              </span>
              <h3 className="text-lg font-semibold text-foreground">Our vision</h3>
              <p className="text-sm text-muted-foreground">
                A world where a learner&apos;s skills - not their credentials or connections -
                determine the opportunities available to them.
              </p>
            </Card>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Core values</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_VALUES.map((value) => (
              <FeatureCard key={value.title} {...value} />
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="border-t border-border bg-muted/20">
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-2 sm:px-6">
            <div className="flex flex-col gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                <BookOpen className="size-5" />
              </span>
              <h3 className="text-lg font-semibold text-foreground">Teaching philosophy</h3>
              <p className="text-sm text-muted-foreground">
                We believe people learn by doing, not by watching. Every course is built around
                projects and exercises that mirror real work, so what you practice is what you will
                actually use.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Users className="size-5" />
              </span>
              <h3 className="text-lg font-semibold text-foreground">Learning methodology</h3>
              <p className="text-sm text-muted-foreground">
                Courses are self-paced with structured sections and lessons, so you can move quickly
                through what you already know and slow down where you need it.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">
            Our journey
          </h2>
          <Timeline entries={TIMELINE} />
        </section>
      </Reveal>

      <Reveal>
        <CtaBannerSection />
      </Reveal>
    </div>
  );
}
