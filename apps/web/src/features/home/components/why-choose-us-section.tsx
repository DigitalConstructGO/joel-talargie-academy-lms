import {
  Award,
  CheckCircle2,
  Clock,
  GraduationCap,
  PlayCircle,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FeatureCard } from '@/components/marketing/feature-card';
import type { WhyChooseUsItem } from '@/features/settings/types/settings.types';

const ICON_MAP: Record<string, LucideIcon> = {
  Clock,
  Users,
  Award,
  ShieldCheck,
  Smartphone,
  UserPlus,
  Search,
  PlayCircle,
  Sparkles,
  CheckCircle2,
  Target,
  Zap,
  GraduationCap,
  Star,
};

const DEFAULT_FEATURES: WhyChooseUsItem[] = [
  {
    id: '1',
    icon: 'Clock',
    title: 'Learn at your own pace',
    description:
      'Courses are self-paced with full lifetime access, so you can learn on your schedule.',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: '2',
    icon: 'Award',
    title: 'Earn certificates',
    description: 'Complete eligible courses to earn a certificate of completion you can share.',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: '3',
    icon: 'ShieldCheck',
    title: 'Vetted instructors',
    description: 'Every course is reviewed before publishing to keep quality high.',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: '4',
    icon: 'Smartphone',
    title: 'Learn anywhere',
    description: 'A fully responsive experience across desktop, tablet, and mobile.',
    displayOrder: 4,
    isActive: true,
  },
];

export function WhyChooseUsSection({ items }: { items?: WhyChooseUsItem[] }) {
  const displayItems = items && items.length > 0 ? items : DEFAULT_FEATURES;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Why Choose the Academy
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need to learn effectively, in one place.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {displayItems.map((feature) => {
          const Icon = ICON_MAP[feature.icon] ?? Sparkles;
          return (
            <FeatureCard
              key={feature.id || feature.title}
              icon={Icon}
              title={feature.title}
              description={feature.description}
            />
          );
        })}
      </div>
    </section>
  );
}
