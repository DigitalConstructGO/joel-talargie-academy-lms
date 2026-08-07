'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
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
import { ROUTES } from '@/constants/routes';
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

export default function LessonPlayerPage() {
  const params = useParams<{ enrollmentId: string }>();
  const enrollmentId = params.enrollmentId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const currentIndex = flatLessons.findIndex((lesson) => lesson.id === activeLessonId);
  const previousLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : undefined;
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : undefined;

  async function handleComplete() {
    if (!activeLessonId) return;
    try {
      const result = await completeLesson.mutateAsync(activeLessonId);
      if (result.courseCompleted) {
        toast.success('Course completed!', "Great work - you've finished every mandatory lesson.");
        router.push(ROUTES.dashboard.courses);
        return;
      }
      toast.success('Lesson completed');
      if (nextLesson) goToLesson(nextLesson.id);
    } catch {
      toast.error('Could not mark this lesson complete', 'Please try again.');
    }
  }

  if (overviewQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-sidebar">
        <Loader2 className="size-8 animate-spin text-sidebar-primary" />
      </div>
    );
  }

  if (overviewQuery.isError || !overview) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-sidebar p-8 text-center">
        <ErrorState
          className="border-white/10 bg-white/5"
          title="We couldn't load this course"
          description="You may not have learning access to this course yet, or it's no longer available."
          onRetry={() => overviewQuery.refetch()}
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

  const activeLesson = flatLessons.find((lesson) => lesson.id === activeLessonId);
  const activeSection = overview.curriculum.find(
    (section) => section.id === activeLesson?.sectionId,
  );
  const lesson = lessonQuery.data;

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
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 border-white/20 text-white hover:bg-white/10"
          asChild
        >
          <Link href={ROUTES.dashboard.courses}>
            <X className="size-4" />
            <span className="hidden sm:inline">Exit Focus Mode</span>
          </Link>
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="w-[300px] flex-none overflow-hidden border-r border-sidebar-border">
            <LessonSidebar
              curriculum={overview.curriculum}
              currentLessonId={activeLessonId}
              overallProgress={overview.progressPercentage}
              onSelectLesson={goToLesson}
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
                initialPositionSeconds={activeLesson?.savedPositionSeconds ?? 0}
                onProgress={(seconds) =>
                  savePosition.mutate({ lessonId: lesson.id, positionSeconds: seconds })
                }
                onEnded={() =>
                  savePosition.mutate({
                    lessonId: lesson.id,
                    positionSeconds: lesson.durationSeconds ?? 0,
                  })
                }
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
        <Button
          className="gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          onClick={handleComplete}
          disabled={completeLesson.isPending || !activeLessonId}
        >
          {completeLesson.isPending && <Loader2 className="size-4 animate-spin" />}
          Complete &amp; Next
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
