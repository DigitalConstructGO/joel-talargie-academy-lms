import { cn } from '@/lib/utils';

export function ContentContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6', className)}>{children}</div>
  );
}
