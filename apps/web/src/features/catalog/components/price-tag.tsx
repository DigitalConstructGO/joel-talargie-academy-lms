'use client';

import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { CourseAccessType } from '../types/catalog.types';

export interface PriceTagProps {
  accessType: CourseAccessType;
  price: string;
  discountPrice: string | null;
  currency: string;
  className?: string;
}

export function PriceTag({ accessType, price, discountPrice, currency, className }: PriceTagProps) {
  const { t } = useLanguage();

  if (accessType === 'FREE') {
    return (
      <span className={cn('text-sm font-semibold text-success', className)}>
        {t('common.free')}
      </span>
    );
  }

  const hasDiscount = discountPrice !== null && Number(discountPrice) < Number(price);

  return (
    <span className={cn('flex items-baseline gap-2', className)}>
      <span className="text-sm font-semibold text-foreground">
        {formatCurrency(hasDiscount ? discountPrice : price, currency)}
      </span>
      {hasDiscount && (
        <span className="text-xs text-muted-foreground line-through">
          {formatCurrency(price, currency)}
        </span>
      )}
    </span>
  );
}
