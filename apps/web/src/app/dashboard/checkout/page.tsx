'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useCourse } from '@/features/catalog/hooks/use-courses';
import { useCreateEnrollment } from '@/features/enrollments/hooks/use-enrollments';
import { usePaymentInstructions } from '@/features/payments/hooks/use-payments';
import type { SubmitPaymentResult } from '@/features/payments/types/payment.types';
import type { RedeemCouponResult } from '@/features/promotions/types/promotion.types';
import { CheckoutStepper } from '@/features/checkout/components/checkout-stepper';
import { OrderSummaryCard } from '@/features/checkout/components/order-summary-card';
import { CourseSummaryStep } from '@/features/checkout/components/course-summary-step';
import { PromoCodeStep } from '@/features/checkout/components/promo-code-step';
import { PaymentMethodStep } from '@/features/checkout/components/payment-method-step';
import { ConfirmationStep } from '@/features/checkout/components/confirmation-step';
import type {
  CheckoutStepId,
  SubmittedPaymentSummary,
} from '@/features/checkout/types/checkout.types';
import { toast } from '@/lib/toast';

interface CheckoutDraft {
  step: CheckoutStepId;
  enrollmentId?: string;
  redemption?: RedeemCouponResult | null;
  paymentResult?: SubmitPaymentResult | null;
  paymentSummary?: SubmittedPaymentSummary | null;
  isFreeEnrollment?: boolean;
}

function draftKey(slug: string) {
  return `joel-academy-checkout-draft:${slug}`;
}

function CheckoutSkeleton() {
  return (
    <ContentContainer>
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="mt-6 flex items-center justify-between gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="size-8 rounded-full" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </ContentContainer>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = searchParams.get('course') ?? '';

  const courseQuery = useCourse(slug);
  const createEnrollment = useCreateEnrollment();

  const [step, setStep] = useState<CheckoutStepId>(1);
  const [enrollmentId, setEnrollmentId] = useState<string | undefined>();
  const [redemption, setRedemption] = useState<RedeemCouponResult | null>(null);
  const [paymentResult, setPaymentResult] = useState<SubmitPaymentResult | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<SubmittedPaymentSummary | null>(null);
  const [isFreeEnrollment, setIsFreeEnrollment] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const instructionsQuery = usePaymentInstructions(step >= 3 ? enrollmentId : undefined);

  // Restore in-progress checkout (per-course draft) so a refresh or accidental tab close doesn't lose progress.
  useEffect(() => {
    if (!slug) return;
    try {
      const raw = sessionStorage.getItem(draftKey(slug));
      if (raw) {
        const draft = JSON.parse(raw) as CheckoutDraft;
        setStep(draft.step ?? 1);
        setEnrollmentId(draft.enrollmentId);
        setRedemption(draft.redemption ?? null);
        setPaymentResult(draft.paymentResult ?? null);
        setPaymentSummary(draft.paymentSummary ?? null);
        setIsFreeEnrollment(draft.isFreeEnrollment ?? false);
      }
    } catch {
      sessionStorage.removeItem(draftKey(slug));
    }
    setHydrated(true);
  }, [slug]);

  useEffect(() => {
    if (!slug || !hydrated) return;
    const draft: CheckoutDraft = {
      step,
      enrollmentId,
      redemption,
      paymentResult,
      paymentSummary,
      isFreeEnrollment,
    };
    sessionStorage.setItem(draftKey(slug), JSON.stringify(draft));
    router.replace(`${pathname}?course=${encodeURIComponent(slug)}&step=${step}`, {
      scroll: false,
    });
  }, [
    step,
    enrollmentId,
    redemption,
    paymentResult,
    paymentSummary,
    isFreeEnrollment,
    hydrated,
    slug,
    router,
    pathname,
  ]);

  // Free courses bypass checkout entirely: the course page's enroll card
  // enrolls directly and opens the lesson player. Redirect anyone who lands
  // here on a free course (e.g. a stale bookmark) back to that flow.
  useEffect(() => {
    if (!hydrated || !courseQuery.data) return;
    if (courseQuery.data.accessType === 'FREE') {
      router.replace(ROUTES.dashboard.courseDetail(courseQuery.data.slug), {
        scroll: false,
      });
    }
  }, [hydrated, courseQuery.data, router]);

  // Guard against landing on a later step without the state it depends on (e.g. a stale bookmarked URL).
  useEffect(() => {
    if (!hydrated) return;
    if (step >= 3 && !enrollmentId) {
      setStep(2);
    }
  }, [hydrated, step, enrollmentId]);

  async function handlePromoNext() {
    if (!courseQuery.data) return;
    try {
      const result = await createEnrollment.mutateAsync({
        courseId: courseQuery.data.id,
        redemptionId: redemption?.redemptionId,
      });
      setEnrollmentId(result.enrollment.id);
      if (result.enrollment.status === 'ENROLLED') {
        setIsFreeEnrollment(true);
        setStep(3);
      } else {
        setStep(3);
      }
    } catch {
      toast.error('Could not start enrollment.', 'Please try again.');
    }
  }

  if (!slug) {
    return (
      <ContentContainer>
        <PageHeader title="Checkout" description="Complete your enrollment." />
        <ErrorState
          title="No course selected"
          description="Choose a course to enroll in before starting checkout."
          onRetry={() => router.push(ROUTES.dashboard.browseCourses)}
          retryLabel="Browse Courses"
        />
      </ContentContainer>
    );
  }

  if (courseQuery.isLoading || !hydrated) {
    return <CheckoutSkeleton />;
  }

  if (courseQuery.isError || !courseQuery.data) {
    return (
      <ContentContainer>
        <PageHeader title="Checkout" description="Complete your enrollment." />
        <ErrorState
          title="We couldn't load this course"
          description="It may have been removed or is no longer available."
          onRetry={() => courseQuery.refetch()}
        />
      </ContentContainer>
    );
  }

  const course = courseQuery.data;

  return (
    <ContentContainer>
      <div className="mb-4">
        <PageBreadcrumb
          items={[
            { label: 'Home', href: ROUTES.home },
            { label: 'Courses', href: ROUTES.dashboard.browseCourses },
            { label: course.title, href: ROUTES.dashboard.courseDetail(course.slug) },
            { label: 'Checkout' },
          ]}
        />
      </div>

      <PageHeader title="Checkout" description={`Enrolling in ${course.title}`} />

      <div className="mb-2">
        <CheckoutStepper currentStep={step} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div>
          {step === 1 && <CourseSummaryStep course={course} onNext={() => setStep(2)} />}

          {step === 2 && (
            <PromoCodeStep
              courseId={course.id}
              redemption={redemption}
              onApplied={setRedemption}
              onClear={() => setRedemption(null)}
              onBack={() => router.push(ROUTES.dashboard.courseDetail(course.slug))}
              onNext={handlePromoNext}
              isAdvancing={createEnrollment.isPending}
            />
          )}

          {step === 3 &&
            enrollmentId &&
            (isFreeEnrollment || (paymentResult && paymentSummary) ? (
              <ConfirmationStep
                courseTitle={course.title}
                isFreeEnrollment={isFreeEnrollment}
                result={paymentResult}
                summary={paymentSummary}
              />
            ) : (
              <PaymentMethodStep
                enrollmentId={enrollmentId}
                instructions={instructionsQuery.data}
                isLoadingInstructions={instructionsQuery.isLoading}
                onSubmitted={(result, summary) => {
                  setPaymentResult(result);
                  setPaymentSummary(summary);
                }}
                onBack={() => setStep(2)}
              />
            ))}
        </div>

        {(step < 3 || (step === 3 && !isFreeEnrollment && !paymentResult)) && (
          <OrderSummaryCard course={course} redemption={redemption} />
        )}
      </div>
    </ContentContainer>
  );
}
