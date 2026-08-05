import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizes = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
} as const;

export interface LoadingSpinnerProps {
  size?: keyof typeof sizes;
  label?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', label = 'Loading', className }: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      className={cn('inline-flex items-center gap-2 text-muted-foreground', className)}
    >
      <Loader2 className={cn('animate-spin', sizes[size])} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function FullPageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
