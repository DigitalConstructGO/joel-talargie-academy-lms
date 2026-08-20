'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Loader2, Signal, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDurationMinutes } from '@/lib/format';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores';
import {
  useCreateEnrollment,
  useEnrollmentByCourse,
} from '@/features/enrollments/hooks/use-enrollments';
import { extractErrorMessage } from '@/lib/api/api-error';
import { toast } from '@/lib/toast';
import { PriceTag } from './price-tag';
import { WishlistButton } from './wishlist-button';
import { CourseThumbnail } from './course-thumbnail';
import { DIFFICULTY_LABELS } from '../constants/catalog.constants';
import type { CourseDetail } from '../types/catalog.types';

export function CourseEnrollCard({ course }: { course: CourseDetail }) {
  const router = useRouter();
  const authenticated = useAuthStore((state) => state.authenticated);
  const enrollmentQuery = useEnrollmentByCourse(authenticated ? course.id : '');
  const createEnrollment = useCreateEnrollment();
  const enrollment = enrollmentQuery.data?.enrolled ? enrollmentQuery.data.enrollment : null;

  const isFree = course.accessType === 'FREE';

  async function handleEnroll() {
    try {
      const result = await createEnrollment.mutateAsync({ courseId: course.id });
      router.push(ROUTES.dashboard.learn(result.enrollment.id));
    } catch (error) {
      toast.error('Could not start this course.', extractErrorMessage(error, 'Please try again.'));
    }
  }

  const ctaHref = enrollment
    ? ROUTES.dashboard.learn(enrollment.id)
    : authenticated
      ? isFree
        ? undefined
        : `${ROUTES.dashboard.checkout}?course=${course.slug}`
      : `${ROUTES.auth.register}?redirect=${encodeURIComponent(ROUTES.courses.detail(course.slug))}`;

  const ctaLabel = enrollment
    ? enrollment.status === 'COMPLETED'
      ? 'Review Course'
      : enrollment.progressPercentage > 0
        ? 'Continue Learning'
        : 'Start Learning'
    : authenticated
      ? isFree
        ? 'Enroll Free'
        : 'Enroll Now'
      : 'Sign Up to Enroll';

  return (
    <Card className="sticky top-24 overflow-hidden">
      <CourseThumbnail
        title={course.title}
        categoryName={course.categoryName}
        categorySlug={course.categorySlug}
        thumbnailKey={course.thumbnailKey}
        showBadge={false}
        className="aspect-video w-full rounded-t-xl rounded-b-none"
      />
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

        {isFree && authenticated && !enrollment ? (
          <Button
            size="lg"
            className="w-full"
            onClick={handleEnroll}
            disabled={createEnrollment.isPending}
          >
            {createEnrollment.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {createEnrollment.isPending ? 'Enrolling…' : ctaLabel}
          </Button>
        ) : (
          <Button asChild size="lg" className="w-full">
            <Link href={ctaHref!}>{ctaLabel}</Link>
          </Button>
        )}

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
