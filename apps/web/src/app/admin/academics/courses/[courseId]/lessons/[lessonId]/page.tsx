'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { Can } from '@/components/auth/can';
import { useAdminCourse } from '@/features/catalog/hooks/use-admin-courses';
import {
  useCreateResource,
  useDeleteResource,
  useUpdateLesson,
} from '@/features/catalog/hooks/use-admin-curriculum';
import type {
  LessonType,
  ResourceVisibility,
} from '@/features/catalog/types/admin-curriculum.types';
import { ROUTES } from '@/constants/routes';
import { formatFileSize } from '@/lib/format';
import { toast } from '@/lib/toast';

const LESSON_TYPE_OPTIONS: { label: string; value: LessonType }[] = [
  { label: 'Video', value: 'VIDEO' },
  { label: 'Text', value: 'TEXT' },
  { label: 'Document', value: 'DOCUMENT' },
  { label: 'Download', value: 'DOWNLOAD' },
  { label: 'External link', value: 'EXTERNAL_LINK' },
];

export default function AdminLessonDetailPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const courseQuery = useAdminCourse(courseId);
  const updateLesson = useUpdateLesson();
  const createResource = useCreateResource();
  const deleteResource = useDeleteResource();

  const course = courseQuery.data;
  const lesson = course?.sections.flatMap((s) => s.lessons).find((l) => l.id === lessonId);

  const [title, setTitle] = useState('');
  const [lessonType, setLessonType] = useState<LessonType>('VIDEO');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setLessonType(lesson.lessonType);
      setContent(lesson.content ?? '');
      setVideoUrl(lesson.videoUrl ?? '');
      setExternalUrl(lesson.externalUrl ?? '');
      setDurationSeconds(lesson.durationSeconds?.toString() ?? '');
      setIsMandatory(lesson.isMandatory);
    }
  }, [lesson]);

  async function handleSave() {
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
            durationSeconds: durationSeconds ? Number(durationSeconds) : null,
            isMandatory,
          },
        ],
      });
      toast.success('Lesson updated');
    } catch {
      toast.error('Could not update this lesson');
    }
  }

  async function handleAddResource() {
    if (!resourceTitle.trim() || !resourceUrl.trim()) return;
    try {
      await createResource.mutateAsync({
        courseId,
        args: [
          lessonId,
          {
            title: resourceTitle.trim(),
            externalUrl: resourceUrl.trim(),
            visibility: 'ENROLLED_STUDENTS' as ResourceVisibility,
          },
        ],
      });
      toast.success('Resource added');
      setResourceTitle('');
      setResourceUrl('');
    } catch {
      toast.error('Could not add this resource');
    }
  }

  async function handleDeleteResource(resourceId: string) {
    try {
      await deleteResource.mutateAsync({ courseId, args: [resourceId] });
      toast.success('Resource removed');
    } catch {
      toast.error('Could not remove this resource');
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
      <PageHeader title={lesson?.title ?? 'Lesson details'} description={course?.title} />

      {courseQuery.isLoading || !lesson ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Title</Label>
                <Input id="lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lesson-type">Type</Label>
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
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                  />
                </div>
              </div>
              {lessonType === 'VIDEO' && (
                <div className="space-y-2">
                  <Label htmlFor="video-url">Video URL</Label>
                  <Input
                    id="video-url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>
              )}
              {lessonType === 'EXTERNAL_LINK' && (
                <div className="space-y-2">
                  <Label htmlFor="external-url">External URL</Label>
                  <Input
                    id="external-url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                  />
                </div>
              )}
              {(lessonType === 'TEXT' || lessonType === 'DOCUMENT') && (
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={isMandatory}
                  onCheckedChange={(v) => setIsMandatory(Boolean(v))}
                />
                Mandatory for course completion
              </label>
              <Can permission="lessons.update">
                <Button onClick={handleSave} disabled={!title.trim() || updateLesson.isPending}>
                  {updateLesson.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save changes
                </Button>
              </Can>
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
                      <p className="truncate font-medium text-foreground">{resource.title}</p>
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
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Resource title"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                  />
                  <Input
                    placeholder="https://..."
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="gap-2 whitespace-nowrap"
                    onClick={handleAddResource}
                    disabled={
                      !resourceTitle.trim() || !resourceUrl.trim() || createResource.isPending
                    }
                  >
                    {createResource.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    Add
                  </Button>
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
