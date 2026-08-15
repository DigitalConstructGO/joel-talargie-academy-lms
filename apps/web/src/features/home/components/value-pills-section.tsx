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
import type { ValuePillItem } from '@/features/settings/types/settings.types';

const ICON_MAP: Record<string, React.ElementType> = {
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

const DEFAULT_VALUES: ValuePillItem[] = [
  {
    id: '1',
    icon: 'Clock',
    title: 'Self-Paced Learning',
    description: 'Study on your own schedule with lifetime access to every course you enroll in.',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: '2',
    icon: 'Users',
    title: 'Real Instructors',
    description: 'Courses taught by working professionals, not narrators reading slides.',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: '3',
    icon: 'Award',
    title: 'Verified Certificates',
    description: 'Finish a certificate-eligible course and show what you learned to employers.',
    displayOrder: 3,
    isActive: true,
  },
];

export function ValuePillsSection({ items }: { items?: ValuePillItem[] }) {
  const displayItems = items && items.length > 0 ? items : DEFAULT_VALUES;

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        {displayItems.map((value) => {
          const Icon = ICON_MAP[value.icon] ?? Sparkles;
          return (
            <div key={value.id || value.title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{value.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{value.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
