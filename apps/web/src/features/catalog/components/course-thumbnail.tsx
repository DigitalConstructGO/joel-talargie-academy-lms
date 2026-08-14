'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Cloud,
  Code2,
  Database,
  Megaphone,
  Palette,
  Server,
  Shield,
  Smartphone,
  TestTube2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  'web-development': Code2,
  'mobile-development': Smartphone,
  'data-science': BarChart3,
  'artificial-intelligence': Server,
  'cloud-computing': Cloud,
  devops: Server,
  cybersecurity: Shield,
  'ui-ux-design': Palette,
  'programming-languages': Code2,
  'database-systems': Database,
  'business-management': Briefcase,
  'digital-marketing': Megaphone,
  'graphic-design': Palette,
  'project-management': Briefcase,
  'software-testing': TestTube2,
};

/** Categories with a real (licensed, downloaded) photo under /public/images/categories/. */
const CATEGORY_PHOTOS = new Set(Object.keys(CATEGORY_ICONS));

const TINTS = [
  { icon: 'text-chart-1', ring: 'ring-chart-1/30', glow: 'hsl(var(--chart-1) / 0.35)' },
  { icon: 'text-chart-2', ring: 'ring-chart-2/30', glow: 'hsl(var(--chart-2) / 0.35)' },
  { icon: 'text-chart-4', ring: 'ring-chart-4/30', glow: 'hsl(var(--chart-4) / 0.35)' },
  { icon: 'text-chart-3', ring: 'ring-chart-3/30', glow: 'hsl(var(--chart-3) / 0.35)' },
  { icon: 'text-chart-5', ring: 'ring-chart-5/30', glow: 'hsl(var(--chart-5) / 0.35)' },
];

function pickTint(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return TINTS[hash % TINTS.length] ?? TINTS[0]!;
}

export interface CourseThumbnailProps {
  title: string;
  categoryName?: string;
  categorySlug?: string;
  thumbnailKey?: string | null;
  thumbnailUrl?: string | null;
  showBadge?: boolean;
  className?: string;
}

/**
 * Renders an uploaded course thumbnail image if available, falling back to
 * licensed category photos or a styled category-icon placeholder.
 */
export function CourseThumbnail({
  title,
  categoryName,
  categorySlug,
  thumbnailKey,
  thumbnailUrl,
  showBadge = true,
  className,
}: CourseThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  const resolvedUrl =
    thumbnailUrl ||
    (thumbnailKey
      ? `/api/v1/storage/course-thumbnails/${thumbnailKey.replace(/^course-thumbnails\//, '')}`
      : null);

  if (resolvedUrl && !imageError) {
    return (
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted',
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedUrl}
          alt={categoryName ?? title}
          className="size-full object-cover"
          onError={() => setImageError(true)}
        />
        {showBadge && (
          <div
            className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent"
            aria-hidden="true"
          />
        )}
        {showBadge && categoryName && (
          <span className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
            {categoryName}
          </span>
        )}
      </div>
    );
  }

  if (categorySlug && CATEGORY_PHOTOS.has(categorySlug)) {
    return (
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted',
          className,
        )}
      >
        <Image
          src={`/images/categories/${categorySlug}.jpg`}
          alt={categoryName ?? title}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover"
        />
        {showBadge && (
          <div
            className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent"
            aria-hidden="true"
          />
        )}
        {showBadge && categoryName && (
          <span className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
            {categoryName}
          </span>
        )}
      </div>
    );
  }

  const tint = pickTint(title);
  const Icon = (categorySlug && CATEGORY_ICONS[categorySlug]) || BookOpen;

  return (
    <div
      className={cn(
        'relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-t-xl bg-surface-dark',
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 30%, ${tint.glow}, transparent 60%)`,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--surface-dark-foreground) / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--surface-dark-foreground) / 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />
      <span
        className={cn(
          'relative flex size-12 items-center justify-center rounded-2xl bg-white/10 ring-1 backdrop-blur-sm',
          tint.ring,
        )}
      >
        <Icon className={cn('size-6', tint.icon)} aria-hidden="true" />
      </span>
      {showBadge && categoryName && (
        <span className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          {categoryName}
        </span>
      )}
    </div>
  );
}
