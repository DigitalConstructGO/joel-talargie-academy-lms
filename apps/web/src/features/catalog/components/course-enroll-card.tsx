'use client';

import Link from 'next/link';
import { CheckCircle2, Clock, Signal, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDurationMinutes } from '@/lib/format';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores';
import { PriceTag } from './price-tag';
import { WishlistButton } from './wishlist-button';
import { DIFFICULTY_LABELS } from '../constants/catalog.constants';
import type { CourseDetail } from '../types/catalog.types';

export function CourseEnrollCard({ course }: { course: CourseDetail }) {
  const authenticated = useAuthStore((state) => state.authenticated);

  return (
    <Card className="sticky top-24">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <PriceTag
            accessType={course.accessType}
            price={course.price}
            discountPrice={course.discountPrice}
            currency={course.currency}
            className="text-xl"
          />
          <WishlistButton courseId={course.id} courseTitle={course.title} />
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href={authenticated ? ROUTES.dashboard.root : ROUTES.auth.register}>
            {authenticated ? 'Go to dashboard to enroll' : 'Sign up to enroll'}
          </Link>
        </Button>

        <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Signal className="size-4 shrink-0" />
            {DIFFICULTY_LABELS[course.difficulty]} level
          </li>
          {course.estimatedDurationMinutes && (
            <li className="flex items-center gap-2">
              <Clock className="size-4 shrink-0" />
              {formatDurationMinutes(course.estimatedDurationMinutes)} total
            </li>
          )}
          {course.certificateEnabled && (
            <li className="flex items-center gap-2">
              <Award className="size-4 shrink-0" />
              Certificate of completion
            </li>
          )}
          <li className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            Full lifetime access
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
