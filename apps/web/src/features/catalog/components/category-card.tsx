import Link from 'next/link';
import { Layers, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import type { Category } from '../types/catalog.types';

export interface CategoryCardProps {
  category: Category;
  courseCount?: number;
  className?: string;
}

export function CategoryCard({ category, courseCount, className }: CategoryCardProps) {
  return (
    <Card className={cn('group overflow-hidden transition-shadow hover:shadow-md', className)}>
      <Link href={ROUTES.categories.detail(category.slug)} className="flex flex-col gap-3 p-5">
        <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Layers className="size-5" aria-hidden="true" />
        </span>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-brand">
            {category.name}
          </h3>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
        </div>
        {category.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{category.description}</p>
        )}
        {typeof courseCount === 'number' && (
          <p className="text-xs text-muted-foreground">
            {courseCount} {courseCount === 1 ? 'course' : 'courses'}
          </p>
        )}
      </Link>
    </Card>
  );
}
