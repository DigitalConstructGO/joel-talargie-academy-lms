'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  useArchiveLesson,
  useArchiveSection,
  useCreateLesson,
  useCreateSection,
  useMoveLesson,
  usePublishLesson,
  useReorderLessons,
  useReorderSections,
  useUnpublishLesson,
} from '@/features/catalog/hooks/use-admin-curriculum';
import type { AdminCourseSection } from '@/features/catalog/types/admin-course.types';
import type { LessonType } from '@/features/catalog/types/admin-curriculum.types';
import { ROUTES } from '@/constants/routes';
import { formatDurationSeconds } from '@/lib/format';
import { toast } from '@/lib/toast';

const LESSON_TYPE_OPTIONS: { label: string; value: LessonType }[] = [
  { label: 'Video', value: 'VIDEO' },
  { label: 'Text', value: 'TEXT' },
  { label: 'Document', value: 'DOCUMENT' },
  { label: 'Download', value: 'DOWNLOAD' },
  { label: 'External link', value: 'EXTERNAL_LINK' },
];

function AddSectionDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const createSection = useCreateSection();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await createSection.mutateAsync({
        courseId,
        args: [{ title: title.trim(), description: description.trim() || undefined }],
      });
      toast.success('Section added');
      setTitle('');
      setDescription('');
      setOpen(false);
    } catch {
      toast.error('Could not add this section');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Can permission="sections.create">
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Add section
        </Button>
      </Can>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New section</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-title">Title</Label>
            <Input id="section-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-description">Description (optional)</Label>
            <Textarea
              id="section-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!title.trim() || createSection.isPending}>
              {createSection.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add section
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddLessonDialog({ courseId, sectionId }: { courseId: string; sectionId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [lessonType, setLessonType] = useState<LessonType>('VIDEO');
  const [videoUrl, setVideoUrl] = useState('');
  const createLesson = useCreateLesson();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await createLesson.mutateAsync({
        courseId,
        args: [
          sectionId,
          {
            title: title.trim(),
            lessonType,
            videoUrl: lessonType === 'VIDEO' && videoUrl.trim() ? videoUrl.trim() : undefined,
          },
        ],
      });
      toast.success('Lesson added');
      setTitle('');
      setVideoUrl('');
      setOpen(false);
    } catch {
      toast.error('Could not add this lesson');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Can permission="lessons.create">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Add lesson
        </Button>
      </Can>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New lesson</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Title</Label>
            <Input id="lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson-type">Type</Label>
            <Select
              value={lessonType}
              onValueChange={(value) => setLessonType(value as LessonType)}
            >
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
          {lessonType === 'VIDEO' && (
            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL (optional)</Label>
              <Input
                id="video-url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!title.trim() || createLesson.isPending}>
              {createLesson.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add lesson
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SectionCard({
  courseId,
  section,
  sections,
  index,
}: {
  courseId: string;
  section: AdminCourseSection;
  sections: AdminCourseSection[];
  index: number;
}) {
  const archiveSection = useArchiveSection();
  const reorderSections = useReorderSections();
  const reorderLessons = useReorderLessons();
  const moveLesson = useMoveLesson();
  const publishLesson = usePublishLesson();
  const unpublishLesson = useUnpublishLesson();
  const archiveLesson = useArchiveLesson();

  async function handleArchiveSection() {
    try {
      await archiveSection.mutateAsync({ courseId, args: [section.id] });
      toast.success('Section archived');
    } catch {
      toast.error('Could not archive this section');
    }
  }

  async function handleMoveSection(direction: -1 | 1) {
    const target = sections[index + direction];
    if (!target) return;
    try {
      await reorderSections.mutateAsync({
        courseId,
        args: [
          [
            { id: section.id, sortOrder: target.position },
            { id: target.id, sortOrder: section.position },
          ],
        ],
      });
    } catch {
      toast.error('Could not reorder sections');
    }
  }

  async function handleMoveLesson(lessonIndex: number, direction: -1 | 1) {
    const target = section.lessons[lessonIndex + direction];
    const lesson = section.lessons[lessonIndex];
    if (!target || !lesson) return;
    try {
      await reorderLessons.mutateAsync({
        courseId,
        args: [
          section.id,
          [
            { id: lesson.id, sortOrder: target.position },
            { id: target.id, sortOrder: lesson.position },
          ],
        ],
      });
    } catch {
      toast.error('Could not reorder lessons');
    }
  }

  async function handleMoveLessonToSection(lessonId: string, targetSectionId: string) {
    if (targetSectionId === section.id) return;
    try {
      await moveLesson.mutateAsync({ courseId, args: [lessonId, targetSectionId, undefined] });
      toast.success('Lesson moved');
    } catch {
      toast.error('Could not move this lesson');
    }
  }

  async function handleTogglePublish(lessonId: string, isPublished: boolean) {
    try {
      if (isPublished) await unpublishLesson.mutateAsync({ courseId, args: [lessonId] });
      else await publishLesson.mutateAsync({ courseId, args: [lessonId] });
    } catch {
      toast.error('Could not update this lesson');
    }
  }

  async function handleArchiveLesson(lessonId: string) {
    try {
      await archiveLesson.mutateAsync({ courseId, args: [lessonId] });
      toast.success('Lesson archived');
    } catch {
      toast.error('Could not archive this lesson');
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{section.title}</CardTitle>
          {section.description && (
            <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Can permission="sections.reorder">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={index === 0}
              onClick={() => handleMoveSection(-1)}
              aria-label="Move section up"
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={index === sections.length - 1}
              onClick={() => handleMoveSection(1)}
              aria-label="Move section down"
            >
              <ArrowDown className="size-4" />
            </Button>
          </Can>
          <Can permission="sections.archive">
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon" className="size-8 text-destructive">
                  <Trash2 className="size-4" />
                </Button>
              }
              title="Archive this section?"
              description="All lessons in this section will be archived with it."
              confirmLabel="Archive"
              variant="destructive"
              onConfirm={handleArchiveSection}
            />
          </Can>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {section.lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lessons yet.</p>
        ) : (
          section.lessons.map((lesson, lessonIndex) => (
            <div
              key={lesson.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <Link
                  href={ROUTES.admin.academicsCourseLesson(courseId, lesson.id)}
                  className="font-medium text-foreground hover:underline"
                >
                  {lesson.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {lesson.lessonType}
                  {lesson.durationSeconds
                    ? ` · ${formatDurationSeconds(lesson.durationSeconds)}`
                    : ''}
                  {lesson.isPreview ? ' · Preview' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={lesson.publishedAt ? 'success' : 'secondary'}>
                  {lesson.publishedAt ? 'Published' : 'Unpublished'}
                </Badge>
                <Can permission="lessons.reorder">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={lessonIndex === 0}
                    onClick={() => handleMoveLesson(lessonIndex, -1)}
                    aria-label="Move lesson up"
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={lessonIndex === section.lessons.length - 1}
                    onClick={() => handleMoveLesson(lessonIndex, 1)}
                    aria-label="Move lesson down"
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                </Can>
                {sections.length > 1 && (
                  <Can permission="lessons.update">
                    <Select
                      value=""
                      onValueChange={(value) => handleMoveLessonToSection(lesson.id, value)}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs" aria-label="Move to section">
                        <SelectValue placeholder="Move to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sections
                          .filter((s) => s.id !== section.id)
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </Can>
                )}
                {lesson.publishedAt ? (
                  <Can permission="lessons.unpublish">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleTogglePublish(lesson.id, true)}
                      aria-label="Unpublish"
                    >
                      <EyeOff className="size-3.5" />
                    </Button>
                  </Can>
                ) : (
                  <Can permission="lessons.publish">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleTogglePublish(lesson.id, false)}
                      aria-label="Publish"
                    >
                      <Eye className="size-3.5" />
                    </Button>
                  </Can>
                )}
                <Can permission="lessons.update">
                  <Button variant="ghost" size="icon" className="size-7" asChild>
                    <Link href={ROUTES.admin.academicsCourseLesson(courseId, lesson.id)}>
                      <Pencil className="size-3.5" />
                    </Link>
                  </Button>
                </Can>
                <Can permission="lessons.archive">
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon" className="size-7 text-destructive">
                        <Trash2 className="size-3.5" />
                      </Button>
                    }
                    title="Archive this lesson?"
                    description="Students will lose access to this lesson."
                    confirmLabel="Archive"
                    variant="destructive"
                    onConfirm={() => handleArchiveLesson(lesson.id)}
                  />
                </Can>
              </div>
            </div>
          ))
        )}
        <AddLessonDialog courseId={courseId} sectionId={section.id} />
      </CardContent>
    </Card>
  );
}

export default function AdminCourseCurriculumPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const courseQuery = useAdminCourse(courseId);
  const course = courseQuery.data;

  if (courseQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Curriculum" />
        <ErrorState
          onRetry={() => courseQuery.refetch()}
          description="Unable to load this course."
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
          { label: 'Curriculum' },
        ]}
      />
      <PageHeader
        title="Curriculum"
        description={course ? `Sections and lessons for ${course.title}` : undefined}
        actions={course && <AddSectionDialog courseId={courseId} />}
      />

      {courseQuery.isLoading || !course ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      ) : course.sections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          No sections yet. Add a section to start building the curriculum.
        </p>
      ) : (
        <div className="space-y-4">
          {course.sections
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((section, index, sorted) => (
              <SectionCard
                key={section.id}
                courseId={courseId}
                section={section}
                sections={sorted}
                index={index}
              />
            ))}
        </div>
      )}
    </ContentContainer>
  );
}
