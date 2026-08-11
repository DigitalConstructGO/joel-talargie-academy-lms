import { Construction } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';

export interface ComingSoonSectionProps {
  feature: string;
  icon?: LucideIcon;
  description?: string;
}

/** Structural placeholder for a nav destination whose business logic ships in a later phase. */
export function ComingSoonSection({
  feature,
  icon = Construction,
  description,
}: ComingSoonSectionProps) {
  return (
    <EmptyState
      icon={icon}
      title={`${feature} is coming soon`}
      description={
        description ??
        `This section is scaffolded but the ${feature.toLowerCase()} feature has not been built yet.`
      }
    />
  );
}
