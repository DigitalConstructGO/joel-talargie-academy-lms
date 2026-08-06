import { Award, Clock, ShieldCheck, Smartphone } from 'lucide-react';
import { FeatureCard } from '@/components/marketing/feature-card';

const FEATURES = [
  {
    icon: Clock,
    title: 'Learn at your own pace',
    description:
      'Courses are self-paced with full lifetime access, so you can learn on your schedule.',
  },
  {
    icon: Award,
    title: 'Earn certificates',
    description: 'Complete eligible courses to earn a certificate of completion you can share.',
  },
  {
    icon: ShieldCheck,
    title: 'Vetted instructors',
    description: 'Every course is reviewed before publishing to keep quality high.',
  },
  {
    icon: Smartphone,
    title: 'Learn anywhere',
    description: 'A fully responsive experience across desktop, tablet, and mobile.',
  },
];

export function WhyChooseUsSection() {
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
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
