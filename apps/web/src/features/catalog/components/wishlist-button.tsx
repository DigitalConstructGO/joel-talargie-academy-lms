'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/stores';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

export interface WishlistButtonProps {
  courseId: string;
  courseTitle: string;
  className?: string;
}

export function WishlistButton({ courseId, courseTitle, className }: WishlistButtonProps) {
  const isWishlisted = useWishlistStore((state) => state.isWishlisted(courseId));
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn('size-8 shrink-0 rounded-full', className)}
      aria-label={
        isWishlisted ? `Remove ${courseTitle} from wishlist` : `Add ${courseTitle} to wishlist`
      }
      aria-pressed={isWishlisted}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleWishlist(courseId);
        toast[isWishlisted ? 'info' : 'success'](
          isWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
          courseTitle,
        );
      }}
    >
      <Heart className={cn('size-4', isWishlisted && 'fill-destructive text-destructive')} />
    </Button>
  );
}
