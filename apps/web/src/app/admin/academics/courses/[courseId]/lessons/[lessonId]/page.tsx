'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Eye, EyeOff, FileText, Loader2, Paperclip, Plus, Trash2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Can } from '@/components/auth/can';
import { useAdminCourse } from '@/features/catalog/hooks/use-admin-courses';
import {
  useCreateResource,
  useDeleteResource,
  usePreviewLesson,
  usePublishLesson,
  useUnpublishLesson,
  useUpdateLesson,
} from '@/features/catalog/hooks/use-admin-curriculum';
import {
  LessonResourceUploader,
  type UploadedResourceData,
} from '@/features/catalog/components/lesson-resource-uploader';
import type {
  LessonType,
  ResourceVisibility,
} from '@/features/catalog/types/admin-curriculum.types';
import { ROUTES } from '@/constants/routes';
import { formatFileSize, formatDurationSeconds } from '@/lib/format';
import { extractErrorMessage } from '@/lib/api/api-error';
import { toast } from '@/lib/toast';

const LESSON_TYPE_OPTIONS: { label: string; value: LessonType }[] = [
  { label: 'Video', value: 'VIDEO' },
  { label: 'Text / Article', value: 'TEXT' },
  { label: 'Document', value: 'DOCUMENT' },
  { label: 'Downloadable File', value: 'DOWNLOAD' },
  { label: 'External Link', value: 'EXTERNAL_LINK' },
];

/**
 * The lesson player accepts two kinds of source: a YouTube link (rendered
 * via YouTube's own embedded player) or a direct, HTTPS link to a playable
 * media file (set as a native `<video src>`) - anything else fails to play.
 * The backend also silently drops non-HTTPS values (`safeHttpsUrl` in
 * `learning.service.ts`), so the HTTPS check mirrors a real constraint.
 */
const VIDEO_FILE_PATTERN = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;
const YOUTUBE_URL_PATTERN =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;

function getVideoUrlError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^https:\/\//i.test(trimmed)) {
    return 'Must start with https:// - the backend rejects non-HTTPS video URLs.';
  }
  if (YOUTUBE_URL_PATTERN.test(trimmed)) return null;
  if (!VIDEO_FILE_PATTERN.test(trimmed)) {
    return 'Must be a YouTube link, or a direct link to a video file (.mp4, .webm, .ogg, .mov).';
  }
  return null;
}

export default function AdminLessonDetailPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const courseQuery = useAdminCourse(courseId);
  const updateLesson = useUpdateLesson();
  const publishLesson = usePublishLesson();
  const unpublishLesson = useUnpublishLesson();
  const previewLesson = usePreviewLesson();
  const createResource = useCreateResource();
  const deleteResource = useDeleteResource();

  const course = courseQuery.data;
  const lesson = course?.sections.flatMap((s) => s.lessons).find((l) => l.id === lessonId);

  const [title, setTitle] = useState('');
  const [lessonType, setLessonType] = useState<LessonType>('VIDEO');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  const videoUrlError = lessonType === 'VIDEO' ? getVideoUrlError(videoUrl) : null;
  const externalUrlError =
    (lessonType === 'EXTERNAL_LINK' || lessonType === 'DOWNLOAD') &&
    externalUrl.trim() &&
    !/^https:\/\//i.test(externalUrl.trim())
      ? 'Must start with https://'
      : null;

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setLessonType(lesson.lessonType);
      setContent(lesson.content ?? '');
      setVideoUrl(lesson.videoUrl ?? '');
      setExternalUrl(lesson.externalUrl ?? '');
      setDurationMinutes(
        lesson.durationSeconds !== null && lesson.durationSeconds !== undefined
          ? Math.round(lesson.durationSeconds / 60).toString()
          : '',
      );
      setIsMandatory(lesson.isMandatory);
      setIsPreview(lesson.isPreview);
    }
  }, [lesson]);

  async function handleSave() {
    if (!title.trim() || videoUrlError || externalUrlError) return;
    const parsedMinutes = durationMinutes.trim() ? Number(durationMinutes) : undefined;
    const durationSeconds =
      parsedMinutes !== undefined && !Number.isNaN(parsedMinutes) && parsedMinutes >= 0
        ? Math.round(parsedMinutes * 60)
        : null;

    try {
      await updateLesson.mutateAsync({
        courseId,
        args: [
          lessonId,
          {
            title: title.trim(),
            lessonType,
            content: content.trim() || null,
            videoUrl: videoUrl.trim() || null,
            externalUrl: externalUrl.trim() || null,
            durationSeconds,
            isMandatory,
          },
        ],
      });

      if (lesson && isPreview !== lesson.isPreview) {
        await previewLesson.mutateAsync({
          courseId,
          args: [lessonId, isPreview],
        });
      }

      toast.success('Lesson updated');
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not update this lesson');
      toast.error('Could not update this lesson', message);
    }
  }

  const isPublished = Boolean(lesson?.isPublished || lesson?.publishedAt);

  async function handleTogglePublish() {
    if (!lesson) return;
    try {
      if (isPublished) {
        await unpublishLesson.mutateAsync({ courseId, args: [lessonId] });
        toast.success('Lesson unpublished');
      } else {
        await publishLesson.mutateAsync({ courseId, args: [lessonId] });
        toast.success('Lesson published');
      }
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not update publication status');
      toast.error('Could not update publication status', message);
    }
  }

  async function handleAddUploadedResource(data: UploadedResourceData) {
    try {
      await createResource.mutateAsync({
        courseId,
        args: [
          lessonId,
          {
            title: data.title.trim(),
            storageKey: data.storageKey,
            externalUrl: data.externalUrl,
            originalFileName: data.originalFileName,
            mimeType: data.mimeType,
            fileSize: data.fileSize,
            visibility: 'ENROLLED_STUDENTS' as ResourceVisibility,
          },
        ],
      });
      toast.success('Resource added to lesson');
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not add this resource');
      toast.error('Could not add this resource', message);
      throw error;
    }
  }

  async function handleDeleteResource(resourceId: string) {
    try {
      await deleteResource.mutateAsync({ courseId, args: [resourceId] });
      toast.success('Resource removed');
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not remove this resource');
      toast.error('Could not remove this resource', message);
    }
  }

  if (courseQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Lesson details" />
        <ErrorState
          onRetry={() => courseQuery.refetch()}
          description="Unable to load this lesson."
        />
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Academic Management', href: ROUTES.admin.academics },
          { label: 'Courses', href: ROUTES.admin.academicsCourses },
          {
            label: course?.title ?? 'Course',
            href: course ? ROUTES.admin.academicsCourseDetail(courseId) : undefined,
          },
          { label: 'Curriculum', href: ROUTES.admin.academicsCourseCurriculum(courseId) },
          { label: lesson?.title ?? 'Lesson' },
        ]}
      />
      <PageHeader
        title={lesson?.title ?? 'Lesson details'}
        description={course ? `Course: ${course.title}` : undefined}
        actions={
          lesson && (
            <div className="flex items-center gap-2">
              <Badge variant={isPublished ? 'success' : 'secondary'}>
                {isPublished ? 'Published' : 'Draft'}
              </Badge>
              {isPublished ? (
                <Can permission="lessons.unpublish">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleTogglePublish}
                    disabled={unpublishLesson.isPending}
                  >
                    {unpublishLesson.isPending && <Loader2 className="size-3.5 animate-spin" />}
                    Unpublish
                  </Button>
                </Can>
              ) : (
                <Can permission="lessons.publish">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={handleTogglePublish}
                    disabled={publishLesson.isPending}
                  >
                    {publishLesson.isPending && <Loader2 className="size-3.5 animate-spin" />}
                    Publish Lesson
                  </Button>
                </Can>
              )}
            </div>
          )
        }
      />

      {courseQuery.isLoading || !lesson ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lesson Content & Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Lesson Title</Label>
                <Input
                  id="lesson-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lesson-type">Lesson Type</Label>
                  <Select value={lessonType} onValueChange={(v) => setLessonType(v as LessonType)}>
                    <SelectTrigger id="lesson-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LESSON_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground" />
                    Estimated Duration (minutes)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 15"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                  />
                  {durationMinutes && Number(durationMinutes) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      = {Math.round(Number(durationMinutes) * 60)} seconds
                    </p>
                  )}
                </div>
              </div>
              {lessonType === 'VIDEO' && (
                <div className="space-y-2">
                  <Label htmlFor="video-url">Video URL</Label>
                  <Input
                    id="video-url"
                    placeholder="https://www.youtube.com/watch?v=... or direct .mp4 URL"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    aria-invalid={Boolean(videoUrlError)}
                  />
                  {videoUrlError ? (
                    <p className="text-xs text-destructive">{videoUrlError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      A YouTube link (watch, youtu.be, or embed), or a direct HTTPS link to a video
                      file (.mp4, .webm, .ogg, .mov).
                    </p>
                  )}
                </div>
              )}
              {(lessonType === 'EXTERNAL_LINK' || lessonType === 'DOWNLOAD') && (
                <div className="space-y-2">
                  <Label htmlFor="external-url">External Resource URL</Label>
                  <Input
                    id="external-url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://..."
                    aria-invalid={Boolean(externalUrlError)}
                  />
                  {externalUrlError && (
                    <p className="text-xs text-destructive">{externalUrlError}</p>
                  )}
                </div>
              )}
              {(lessonType === 'TEXT' || lessonType === 'DOCUMENT') && (
                <div className="space-y-2">
                  <Label htmlFor="content" className="flex items-center gap-1.5">
                    <FileText className="size-3.5 text-muted-foreground" />
                    Content / Notes
                  </Label>
                  <Textarea
                    id="content"
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your lesson notes, article, or documentation here..."
                  />
                </div>
              )}

              <div className="rounded-lg border border-border bg-card/50 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lesson-mandatory" className="font-medium cursor-pointer">
                      Mandatory Lesson
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Required for students to achieve 100% course completion.
                    </p>
                  </div>
                  <Switch
                    id="lesson-mandatory"
                    checked={isMandatory}
                    onCheckedChange={setIsMandatory}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                  <div>
                    <Label htmlFor="lesson-preview" className="font-medium cursor-pointer">
                      Free Preview
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allows prospective students to view this lesson before enrolling.
                    </p>
                  </div>
                  <Switch id="lesson-preview" checked={isPreview} onCheckedChange={setIsPreview} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Can permission="lessons.update">
                  <Button
                    onClick={handleSave}
                    disabled={
                      !title.trim() ||
                      Boolean(videoUrlError) ||
                      Boolean(externalUrlError) ||
                      updateLesson.isPending
                    }
                  >
                    {updateLesson.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Save changes
                  </Button>
                </Can>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lesson.resources.length === 0 ? (
                <p className="text-sm text-muted-foreground">No resources attached.</p>
              ) : (
                lesson.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {resource.title || resource.label || 'Attached Resource'}
                      </p>
                      {resource.fileSize && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(resource.fileSize)}
                        </p>
                      )}
                    </div>
                    <Can permission="lessons.manage_resources">
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" className="size-7 text-destructive">
                            <Trash2 className="size-3.5" />
                          </Button>
                        }
                        title="Remove this resource?"
                        description="Students will no longer see this resource on the lesson."
                        confirmLabel="Remove"
                        variant="destructive"
                        onConfirm={() => handleDeleteResource(resource.id)}
                      />
                    </Can>
                  </div>
                ))
              )}
              <Can permission="lessons.manage_resources">
                <div className="pt-2 border-t border-border">
                  <LessonResourceUploader onSaveResource={handleAddUploadedResource} />
                </div>
              </Can>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            onClick={() => router.push(ROUTES.admin.academicsCourseCurriculum(courseId))}
          >
            Back to curriculum
          </Button>
        </div>
      )}
    </ContentContainer>
  );
}
