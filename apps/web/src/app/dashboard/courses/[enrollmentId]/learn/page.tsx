'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Award,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { extractErrorCode } from '@/lib/api/api-error';
import {
  useCompleteLesson,
  useCourseOverview,
  useLesson,
  useOpenLesson,
  useSavePosition,
} from '@/features/learning/hooks/use-learning';
import { LessonSidebar } from '@/features/learning/components/lesson-sidebar';
import { LessonPlayer } from '@/features/learning/components/lesson-player';
import { LessonTabs } from '@/features/learning/components/lesson-tabs';
import { toast } from '@/lib/toast';

/**
 * Maps the backend's typed access-denial codes (`LearningService.requireAccess()`)
 * to a tailored message, instead of collapsing every reason - pending payment,
 * a cancelled enrollment, an enrollment that isn't the caller's - into one
 * generic "couldn't load this course" state.
 */
const LEARN_ACCESS_ERRORS: Record<string, { title: string; description: string }> = {
  PAYMENT_REQUIRED: {
    title: 'Payment required',
    description: 'Submit payment for this course to start learning.',
  },
  PAYMENT_REVIEW_PENDING: {
    title: 'Payment under review',
    description: "We're reviewing your payment - you'll get access as soon as it's approved.",
  },
  ENROLLMENT_CANCELLED: {
    title: 'Enrollment cancelled',
    description: 'This enrollment was cancelled. Contact support if this looks wrong.',
  },
  ENROLLMENT_ACCESS_REVOKED: {
    title: 'Access revoked',
    description: 'Access to this course has been revoked. Contact support for details.',
  },
  ENROLLMENT_NOT_FOUND: {
    title: 'Enrollment not found',
    description: "This course isn't linked to your account, or the link is incorrect.",
  },
  ACCOUNT_NOT_ACTIVE: {
    title: 'Account not active',
    description: 'Your account is not currently active. Contact support for help.',
  },
  EMAIL_NOT_VERIFIED: {
    title: 'Verify your email',
    description: 'Verify your email address to access course content.',
  },
  STUDENT_ROLE_REQUIRED: {
    title: 'Student access required',
    description: 'This area is only available to student accounts.',
  },
};

export default function LessonPlayerPage() {
  const params = useParams<{ enrollmentId: string }>();
  const enrollmentId = params.enrollmentId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Default to a collapsed, overlay-style sidebar on small screens so it
  // doesn't permanently squeeze the video/content column down to a sliver -
  // runs once `isMobile` resolves after mount, not during SSR.
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const overviewQuery = useCourseOverview(enrollmentId);
  const overview = overviewQuery.data;

  const flatLessons = useMemo(
    () => overview?.curriculum.flatMap((section) => section.lessons) ?? [],
    [overview],
  );

  const lessonIdFromUrl = searchParams.get('lesson');
  const activeLessonId =
    lessonIdFromUrl ??
    overview?.lastLessonId ??
    overview?.nextRecommendedLesson?.id ??
    flatLessons[0]?.id;

  const lessonQuery = useLesson(enrollmentId, activeLessonId);
  const openLesson = useOpenLesson(enrollmentId);
  const savePosition = useSavePosition(enrollmentId);
  const completeLesson = useCompleteLesson(enrollmentId);

  function goToLesson(lessonId: string) {
    router.replace(`${ROUTES.dashboard.learn(enrollmentId)}?lesson=${lessonId}`, { scroll: false });
  }

  // Keep the URL in sync with the resolved lesson (once overview/resume data
  // picks a default) and mark it opened server-side.
  useEffect(() => {
    if (!activeLessonId) return;
    if (searchParams.get('lesson') !== activeLessonId) goToLesson(activeLessonId);
    openLesson.mutate(activeLessonId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the active lesson itself changes
  }, [activeLessonId]);

  const activeLesson = flatLessons.find((item) => item.id === activeLessonId);
  const lesson = lessonQuery.data;

  const isLessonVideo = lesson?.lessonType === 'VIDEO';
  const isLessonAlreadyCompleted = activeLesson?.progressStatus === 'COMPLETED';
  const [videoFinishedLocally, setVideoFinishedLocally] = useState(false);

  // Reset local video finished state when switching lessons
  useEffect(() => {
    setVideoFinishedLocally(false);
  }, [activeLessonId]);

  const isCourseCompleted =
    overview?.progressPercentage === 100 ||
    (flatLessons.length > 0 &&
      flatLessons.every((item) => item.progressStatus === 'COMPLETED'));

  const canComplete = !isLessonVideo || isLessonAlreadyCompleted || videoFinishedLocally;

  const currentIndex = flatLessons.findIndex((lessonItem) => lessonItem.id === activeLessonId);
  const previousLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : undefined;
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : undefined;

  async function handleComplete() {
    if (!activeLessonId) return;
    if (!canComplete) {
      toast.error('Watch Video to Complete', 'Please finish watching the video before completing this lesson.');
      return;
    }
    try {
      const result = await completeLesson.mutateAsync(activeLessonId);
      if (result.courseCompleted) {
        toast.success(
          'Course completed!',
          "Congratulations! You've finished all required lessons and earned your certificate.",
        );
        if (result.certificateId) {
          router.push(`${ROUTES.dashboard.certificates}/${result.certificateId}`);
        } else {
          router.push(ROUTES.dashboard.certificates);
        }
        return;
      }
      toast.success('Lesson completed');
      if (nextLesson) goToLesson(nextLesson.id);
    } catch (error) {
      const code = extractErrorCode(error);
      if (code === 'VIDEO_NOT_COMPLETED') {
        toast.error('Watch Video to Complete', 'Please watch the video lesson to completion before marking it complete.');
      } else {
        toast.error('Could not mark this lesson complete', 'Please try again.');
      }
    }
  }

  if (overviewQuery.isLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 flex-none items-center gap-4 border-b border-sidebar-border px-4 sm:px-6">
          <Skeleton className="size-5 bg-white/10" />
          <Skeleton className="h-4 w-48 bg-white/10" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-[300px] flex-none flex-col gap-3 border-r border-sidebar-border p-4 md:flex">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full bg-white/10" />
            ))}
          </aside>
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
              <Skeleton className="aspect-video w-full rounded-xl bg-white/10" />
              <Skeleton className="mt-6 h-8 w-2/3 bg-white/10" />
              <Skeleton className="mt-4 h-32 w-full bg-white/10" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (overviewQuery.isError || !overview) {
    const accessError = LEARN_ACCESS_ERRORS[extractErrorCode(overviewQuery.error) ?? ''];
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-sidebar p-8 text-center">
        <ErrorState
          className="border-white/10 bg-white/5"
          title={accessError?.title ?? "We couldn't load this course"}
          description={
            accessError?.description ??
            "You may not have learning access to this course yet, or it's no longer available."
          }
          onRetry={accessError ? undefined : () => overviewQuery.refetch()}
        />
        <Button
          asChild
          variant="outline"
          className="gap-2 border-white/20 text-white hover:bg-white/10"
        >
          <Link href={ROUTES.dashboard.courses}>Back to My Courses</Link>
        </Button>
      </div>
    );
  }

  const activeSection = overview.curriculum.find(
    (section) => section.id === activeLesson?.sectionId,
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      <header className="flex h-16 flex-none items-center justify-between border-b border-sidebar-border px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            className="shrink-0 text-sidebar-foreground/60 hover:text-white"
            aria-label={sidebarOpen ? 'Hide course content' : 'Show course content'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-5" />
            ) : (
              <PanelLeftOpen className="size-5" />
            )}
          </button>
          <nav className="hidden min-w-0 items-center gap-2 text-xs text-sidebar-foreground/60 md:flex">
            <Link href={ROUTES.dashboard.courses} className="shrink-0 hover:text-white">
              My Courses
            </Link>
            <ChevronRight className="size-3.5 shrink-0" />
            <span className="max-w-40 truncate text-sidebar-foreground/80">
              {overview.course.title}
            </span>
            {activeSection && (
              <>
                <ChevronRight className="size-3.5 shrink-0" />
                <span className="max-w-32 truncate text-sidebar-foreground/80">
                  {activeSection.title}
                </span>
              </>
            )}
            <ChevronRight className="size-3.5 shrink-0" />
            <span className="max-w-40 truncate font-medium text-white">{activeLesson?.title}</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 gap-1.5 text-xs text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href={ROUTES.dashboard.courses}>
                <ChevronLeft className="size-4" />
                <span>Back to Courses</span>
              </Link>
            </Button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 top-16 z-30 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        {sidebarOpen && (
          <aside
            className={cn(
              'flex-none overflow-hidden border-r border-sidebar-border bg-sidebar',
              isMobile
                ? 'fixed inset-y-16 left-0 z-40 w-[85vw] max-w-[300px] shadow-xl'
                : 'w-[300px]',
            )}
          >
            <LessonSidebar
              curriculum={overview.curriculum}
              currentLessonId={activeLessonId}
              overallProgress={overview.progressPercentage}
              onSelectLesson={(lessonId) => {
                goToLesson(lessonId);
                if (isMobile) setSidebarOpen(false);
              }}
            />
          </aside>
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 pb-28 sm:px-6">
            {lessonQuery.isLoading || !lesson ? (
              <Skeleton className="aspect-video w-full rounded-xl bg-white/10" />
            ) : lesson.lessonType === 'VIDEO' && lesson.videoUrl ? (
              <LessonPlayer
                lessonKey={lesson.id}
                videoUrl={lesson.videoUrl}
                initialPositionSeconds={0}
                isCompleted={activeLesson?.progressStatus === 'COMPLETED'}
                onProgress={(seconds) =>
                  savePosition.mutate({ lessonId: lesson.id, positionSeconds: seconds })
                }
                onEnded={() => {
                  setVideoFinishedLocally(true);
                  savePosition.mutate({
                    lessonId: lesson.id,
                    positionSeconds: lesson.durationSeconds ?? 0,
                  });
                }}
              />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-sidebar-border bg-white/5 text-center">
                <FileText className="size-8 text-sidebar-foreground/40" />
                <p className="text-sm text-sidebar-foreground/60">
                  This lesson has no video - see the Description tab below.
                </p>
              </div>
            )}

            <h1 className="mt-6 text-2xl font-bold text-white">
              {lesson?.title ?? activeLesson?.title}
            </h1>

            {lesson && <LessonTabs lesson={lesson} />}
          </div>
        </main>
      </div>

      <div className="flex flex-none items-center justify-between border-t border-sidebar-border bg-sidebar px-4 py-4 sm:px-6">
        <Button
          variant="outline"
          className="gap-2 border-white/20 text-white hover:bg-white/10"
          disabled={!previousLesson}
          onClick={() => previousLesson && goToLesson(previousLesson.id)}
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Previous Lesson</span>
        </Button>

        {isCourseCompleted ? (
          <Button
            className="gap-2 bg-gradient-to-r from-amber-500 to-emerald-600 font-semibold text-white shadow-md hover:from-amber-600 hover:to-emerald-700"
            asChild
          >
            <Link href={ROUTES.dashboard.certificates}>
              <Award className="size-4" />
              <span>View Certificate</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button
            className={cn(
              'gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90',
              !canComplete && 'opacity-60 cursor-not-allowed',
            )}
            onClick={handleComplete}
            disabled={completeLesson.isPending || !activeLessonId || !canComplete}
          >
            {completeLesson.isPending && <Loader2 className="size-4 animate-spin" />}
            {!canComplete && isLessonVideo ? 'Watch to Complete' : 'Complete & Next'}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
