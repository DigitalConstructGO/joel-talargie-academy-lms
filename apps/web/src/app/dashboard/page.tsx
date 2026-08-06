'use client';

import { Award, BookOpen, Clock, Flame } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { Reveal } from '@/components/common/reveal';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { ProgressCard } from '@/components/dashboard/progress-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { CourseProgressCard } from '@/components/dashboard/course-progress-card';
import { UpcomingClassCard } from '@/components/dashboard/upcoming-class-card';
import { RecommendationCard } from '@/components/dashboard/recommendation-card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores';
import { toast } from '@/lib/toast';

const STATS = [
  { icon: BookOpen, label: 'Lessons Done', value: 42, suffix: '/ 56', tone: 'primary' as const },
  { icon: Clock, label: 'Hours Watched', value: '128.5', tone: 'info' as const },
  { icon: Flame, label: 'Day Streak', value: 14, tone: 'warning' as const },
  { icon: Award, label: 'Certificates', value: '06', tone: 'teal' as const },
];

const MY_COURSES = [
  {
    href: ROUTES.dashboard.courses,
    thumbnailSrc: '/images/categories/ui-ux-design.jpg',
    category: 'Design',
    title: 'Advanced UX Design Patterns',
    completedLessons: 12,
    totalLessons: 18,
  },
  {
    href: ROUTES.dashboard.courses,
    thumbnailSrc: '/images/categories/programming-languages.jpg',
    category: 'Programming',
    title: 'Modern JavaScript: ES2024 & Beyond',
    completedLessons: 4,
    totalLessons: 22,
  },
  {
    href: ROUTES.dashboard.courses,
    thumbnailSrc: '/images/categories/business-management.jpg',
    category: 'Business',
    title: 'Product Strategy for Entrepreneurs',
    completedLessons: 20,
    totalLessons: 20,
  },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.firstName ?? 'there';

  return (
    <ContentContainer>
      <Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <WelcomeBanner
            className="lg:col-span-2"
            greeting={`Welcome back, ${firstName} 👋`}
            description={`You've completed 72% of your "Advanced UX Design" course. Keep up the momentum to earn your certification by next week!`}
            ctaLabel="Resume Learning"
            ctaHref={ROUTES.dashboard.courses}
          />
          <ProgressCard label="Advanced UX Design" description="Module 4: Prototyping" value={72} />
        </div>
      </Reveal>

      <Reveal delaySeconds={0.05}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </Reveal>

      <Reveal delaySeconds={0.1}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-foreground">My Courses</h3>
              <Button variant="link" asChild className="h-auto p-0 text-primary">
                <a href={ROUTES.dashboard.courses}>View All</a>
              </Button>
            </div>
            {MY_COURSES.map((course) => (
              <CourseProgressCard key={course.title} {...course} />
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:col-span-4">
            <UpcomingClassCard
              instructorName="Prof. Elias Thorne"
              instructorTitle="Senior Product Mentor"
              classTitle="Mastering Figma Auto-Layout & Variables"
              date="Today, Oct 24"
              time="04:00 PM - 05:30 PM (GMT+3)"
              onSetReminder={() => toast.success('Reminder set', "We'll notify you before class.")}
            />
            <RecommendationCard
              eyebrow="Recommended for you"
              title="AI-Driven UI Design"
              description="Explore how generative AI is transforming the design workflow."
              href={ROUTES.courses.list}
            />
          </div>
        </div>
      </Reveal>
    </ContentContainer>
  );
}
