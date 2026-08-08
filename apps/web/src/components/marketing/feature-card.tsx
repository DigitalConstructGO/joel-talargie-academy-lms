import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <Card className={cn('flex flex-col gap-3 p-6', className)}>
      <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}
