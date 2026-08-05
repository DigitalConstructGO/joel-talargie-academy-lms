import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRADIENTS = [
  'from-brand/70 via-brand/40 to-transparent',
  'from-violet-500/70 via-violet-500/30 to-transparent',
  'from-sky-500/70 via-sky-500/30 to-transparent',
  'from-amber-500/70 via-amber-500/30 to-transparent',
  'from-emerald-500/70 via-emerald-500/30 to-transparent',
  'from-rose-500/70 via-rose-500/30 to-transparent',
];

function pickGradient(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export interface CourseThumbnailProps {
  title: string;
  categoryName?: string;
  className?: string;
}

/**
 * The public catalog API does not yet expose a pre-resolved thumbnail URL
 * (uploaded images live behind expiring signed-URL tokens), so this renders
 * a deterministic gradient placeholder instead of attempting a broken image
 * fetch. Swap for a real `next/image` once the backend resolves the URL.
 */
export function CourseThumbnail({ title, categoryName, className }: CourseThumbnailProps) {
  const gradient = pickGradient(title);
  return (
    <div
      className={cn(
        'relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-t-xl bg-muted',
        className,
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)} aria-hidden="true" />
      <BookOpen className="relative size-10 text-background/90" aria-hidden="true" />
      {categoryName && (
        <span className="absolute bottom-2 left-2 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          {categoryName}
        </span>
      )}
    </div>
  );
}
