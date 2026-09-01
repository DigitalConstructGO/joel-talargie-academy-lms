'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, BookOpen, ListTree, Pencil, Rocket, RotateCcw, Trash2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Can } from '@/components/auth/can';
import { CourseThumbnail } from '@/features/catalog/components/course-thumbnail';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/stores/auth.store';
import {
  useAdminCourse,
  useArchiveCourse,
  usePublishCourse,
  useRestoreCourse,
  useUnpublishCourse,
} from '@/features/catalog/hooks/use-admin-courses';
import type { CourseStatus } from '@/features/catalog/types/admin-course.types';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/format';
import { formatDate } from '@/lib/date';
import { extractErrorMessage } from '@/lib/api/api-error';
import { toast } from '@/lib/toast';

const STATUS_VARIANT: Record<CourseStatus, 'secondary' | 'success' | 'outline'> = {
  DRAFT: 'secondary',
  PUBLISHED: 'success',
  ARCHIVED: 'outline',
};

export default function AdminCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseQuery = useAdminCourse(courseId);
  const publishCourse = usePublishCourse();
  const unpublishCourse = useUnpublishCourse();
  const archiveCourse = useArchiveCourse();
  const restoreCourse = useRestoreCourse();
  const course = courseQuery.data;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { can } = usePermissions();

  const canManageCourse = (target: typeof course) =>
    Boolean(target) &&
    (can('courses.manage_all') || (currentUserId != null && target!.createdBy === currentUserId));

  async function handlePublish() {
    try {
      await publishCourse.mutateAsync({ courseId, input: undefined });
      toast.success('Course published');
    } catch (error) {
      const message = extractErrorMessage(
        error,
        'Course is not ready to publish. Please check that curriculum sections, published lessons, and outcomes exist.',
      );
      toast.error('Could not publish this course', message);
    }
  }

  async function handleUnpublish() {
    try {
      await unpublishCourse.mutateAsync({ courseId, input: undefined });
      toast.success('Course moved back to draft');
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not unpublish this course');
      toast.error('Could not unpublish this course', message);
    }
  }

  async function handleArchive() {
    try {
      await archiveCourse.mutateAsync({ courseId, input: undefined });
      toast.success('Course archived');
      router.push(ROUTES.admin.academicsCourses);
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not archive this course');
      toast.error('Could not archive this course', message);
    }
  }

  async function handleRestore() {
    try {
      await restoreCourse.mutateAsync({ courseId, input: undefined });
      toast.success('Course restored to draft');
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not restore this course');
      toast.error('Could not restore this course', message);
    }
  }

  if (courseQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Course details" />
        <ErrorState
          onRetry={() => courseQuery.refetch()}
          description="Unable to load this course."
        />
      </ContentContainer>
    );
  }

  const lessonCount =
    course?.sections.reduce((sum, section) => sum + section.lessons.length, 0) ?? 0;

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Academic Management', href: ROUTES.admin.academics },
          { label: 'Courses', href: ROUTES.admin.academicsCourses },
          { label: course?.title ?? 'Course details' },
        ]}
      />
      <PageHeader
        title={course?.title ?? 'Course details'}
        description={course?.shortDescription}
        actions={
          course && (
            <div className="flex flex-wrap gap-2">
              <Can permission="courses.update">
                {canManageCourse(course) && (
                  <Button asChild variant="outline" className="gap-2">
                    <Link href={ROUTES.admin.academicsCourseEdit(courseId)}>
                      <Pencil className="size-4" /> Edit
                    </Link>
                  </Button>
                )}
              </Can>
              <Button asChild variant="outline" className="gap-2">
                <Link href={ROUTES.admin.academicsCourseCurriculum(courseId)}>
                  <ListTree className="size-4" /> Curriculum
                </Link>
              </Button>
              {course.status === 'PUBLISHED' ? (
                <Can permission="courses.unpublish">
                  {canManageCourse(course) && (
                    <LoadingButton
                      variant="outline"
                      className="gap-2"
                      onClick={handleUnpublish}
                      loading={unpublishCourse.isPending}
                      loadingText="Unpublishing..."
                    >
                      Unpublish
                    </LoadingButton>
                  )}
                </Can>
              ) : (
                course.status !== 'ARCHIVED' && (
                  <Can permission="courses.publish">
                    {canManageCourse(course) && (
                      <LoadingButton
                        variant="outline"
                        className="gap-2"
                        onClick={handlePublish}
                        loading={publishCourse.isPending}
                        loadingText="Publishing..."
                      >
                        <Rocket className="size-4" /> Publish
                      </LoadingButton>
                    )}
                  </Can>
                )
              )}
              {course.status === 'ARCHIVED' ? (
                <Can permission="courses.restore">
                  {canManageCourse(course) && (
                    <LoadingButton
                      variant="outline"
                      className="gap-2"
                      onClick={handleRestore}
                      loading={restoreCourse.isPending}
                      loadingText="Restoring..."
                    >
                      <RotateCcw className="size-4" /> Restore
                    </LoadingButton>
                  )}
                </Can>
              ) : (
                <Can permission="courses.archive">
                  {canManageCourse(course) && (
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="outline"
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" /> Archive
                        </Button>
                      }
                      title="Archive this course?"
                      description="Students already enrolled keep their access. The course is hidden from the catalog."
                      confirmLabel="Archive"
                      variant="destructive"
                      onConfirm={handleArchive}
                    />
                  )}
                </Can>
              )}
            </div>
          )
        }
      />

      {courseQuery.isLoading || !course ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANT[course.status]}>{course.status}</Badge>
            <Badge variant="outline">{course.visibility}</Badge>
            {course.featured && <Badge variant="secondary">Featured</Badge>}
          </div>

          {!course.readiness.ready && course.status !== 'PUBLISHED' && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Not ready to publish</p>
                <ul className="mt-1 list-inside list-disc">
                  {course.readiness.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium text-foreground">{course.categoryName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Instructor</p>
                  <p className="font-medium text-foreground">{course.presenterName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="font-medium text-foreground">
                    {course.creator?.name ?? course.creator?.email ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-medium text-foreground">
                    {course.accessType === 'FREE'
                      ? 'Free'
                      : formatCurrency(course.discountPrice ?? course.price, course.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Difficulty</p>
                  <p className="font-medium text-foreground">{course.difficulty}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Certificate</p>
                  <p className="font-medium text-foreground">
                    {course.certificateEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Published</p>
                  <p className="font-medium text-foreground">
                    {course.publishedAt ? formatDate(course.publishedAt) : 'Not published'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm text-foreground">{course.description}</p>
                </div>
                {course.outcomes.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-xs text-muted-foreground">Outcomes</p>
                    <ul className="list-inside list-disc text-sm text-foreground">
                      {course.outcomes.map((outcome) => (
                        <li key={outcome.id}>
                          {outcome.text || (outcome as unknown as { outcome: string }).outcome}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {course.requirements.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-xs text-muted-foreground">Requirements</p>
                    <ul className="list-inside list-disc text-sm text-foreground">
                      {course.requirements.map((requirement) => (
                        <li key={requirement.id}>
                          {requirement.text || (requirement as unknown as { requirement: string }).requirement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="overflow-hidden">
                <CourseThumbnail
                  title={course.title}
                  categoryName={course.categoryName}
                  categorySlug={course.categorySlug}
                  thumbnailKey={course.thumbnailKey}
                  thumbnailUrl={course.thumbnailUrl}
                  className="rounded-none aspect-video w-full"
                />
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="size-4" /> Curriculum
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Sections</dt>
                      <dd className="font-medium text-foreground">{course.sections.length}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Lessons</dt>
                      <dd className="font-medium text-foreground">{lessonCount}</dd>
                    </div>
                  </dl>
                  <Button asChild variant="outline" className="w-full gap-2">
                    <Link href={ROUTES.admin.academicsCourseCurriculum(courseId)}>
                      <ListTree className="size-4" /> Open curriculum builder
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </ContentContainer>
  );
}
