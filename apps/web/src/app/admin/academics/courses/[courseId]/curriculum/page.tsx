'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Can } from '@/components/auth/can';
import { useAdminCourse } from '@/features/catalog/hooks/use-admin-courses';
import {
  useArchiveLesson,
  useArchiveSection,
  useCreateLesson,
  useCreateResource,
  useCreateSection,
  useMoveLesson,
  usePublishLesson,
  useReorderLessons,
  useReorderSections,
  useUnpublishLesson,
  useUpdateSection,
} from '@/features/catalog/hooks/use-admin-curriculum';
import type { AdminCourseSection } from '@/features/catalog/types/admin-course.types';
import type { LessonType } from '@/features/catalog/types/admin-curriculum.types';
import { ROUTES } from '@/constants/routes';
import { formatDurationSeconds } from '@/lib/format';
import { extractErrorMessage } from '@/lib/api/api-error';
import { toast } from '@/lib/toast';

const LESSON_TYPE_OPTIONS: { label: string; value: LessonType }[] = [
  { label: 'Video', value: 'VIDEO' },
  { label: 'Text / Article', value: 'TEXT' },
  { label: 'Document', value: 'DOCUMENT' },
  { label: 'Downloadable File', value: 'DOWNLOAD' },
  { label: 'External Link', value: 'EXTERNAL_LINK' },
];

const VIDEO_FILE_PATTERN = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;
const YOUTUBE_URL_PATTERN =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;

function getVideoUrlError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^https:\/\//i.test(trimmed)) {
    return 'Must start with https:// - non-HTTPS URLs cannot be streamed safely.';
  }
  if (YOUTUBE_URL_PATTERN.test(trimmed)) return null;
  if (!VIDEO_FILE_PATTERN.test(trimmed)) {
    return 'Must be a YouTube link, or a direct HTTPS video file (.mp4, .webm, .mov).';
  }
  return null;
}

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
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not add this section');
      toast.error('Could not add this section', message);
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
            <Input
              id="section-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Module 1: Getting Started"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-description">Description (optional)</Label>
            <Textarea
              id="section-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this section..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createSection.isPending}
            >
              Cancel
            </Button>
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

function EditSectionDialog({
  courseId,
  section,
}: {
  courseId: string;
  section: AdminCourseSection;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description ?? '');
  const updateSection = useUpdateSection();

  useEffect(() => {
    setTitle(section.title);
    setDescription(section.description ?? '');
  }, [section.title, section.description]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await updateSection.mutateAsync({
        courseId,
        args: [
          section.id,
          {
            title: title.trim(),
            description: description.trim() || null,
          },
        ],
      });
      toast.success('Section updated');
      setOpen(false);
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not update this section');
      toast.error('Could not update this section', message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Can permission="sections.update">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(true)}
          aria-label="Edit section"
        >
          <Pencil className="size-4" />
        </Button>
      </Can>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit section</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`edit-section-title-${section.id}`}>Title</Label>
            <Input
              id={`edit-section-title-${section.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Module 1: Getting Started"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-section-desc-${section.id}`}>Description (optional)</Label>
            <Textarea
              id={`edit-section-desc-${section.id}`}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this section..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={updateSection.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || updateSection.isPending}>
              {updateSection.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save changes
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
  const [externalUrl, setExternalUrl] = useState('');
  const [content, setContent] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(true);

  // Optional initial resource attachment
  const [attachResource, setAttachResource] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');

  const createLesson = useCreateLesson();
  const publishLesson = usePublishLesson();
  const createResource = useCreateResource();

  const isSaving =
    createLesson.isPending || publishLesson.isPending || createResource.isPending;

  const videoUrlError = lessonType === 'VIDEO' ? getVideoUrlError(videoUrl) : null;
  const externalUrlError =
    (lessonType === 'EXTERNAL_LINK' || lessonType === 'DOWNLOAD') &&
    externalUrl.trim() &&
    !/^https:\/\//i.test(externalUrl.trim())
      ? 'Must start with https://'
      : null;

  function resetForm() {
    setTitle('');
    setLessonType('VIDEO');
    setVideoUrl('');
    setExternalUrl('');
    setContent('');
    setDurationMinutes('');
    setIsMandatory(true);
    setIsPreview(false);
    setPublishImmediately(true);
    setAttachResource(false);
    setResourceTitle('');
    setResourceUrl('');
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || videoUrlError || externalUrlError) return;

    const parsedMinutes = durationMinutes.trim() ? Number(durationMinutes) : undefined;
    const durationSeconds =
      parsedMinutes !== undefined && !Number.isNaN(parsedMinutes) && parsedMinutes >= 0
        ? Math.round(parsedMinutes * 60)
        : undefined;

    try {
      const newLesson = (await createLesson.mutateAsync({
        courseId,
        args: [
          sectionId,
          {
            title: title.trim(),
            lessonType,
            videoUrl:
              lessonType === 'VIDEO' && videoUrl.trim() ? videoUrl.trim() : undefined,
            externalUrl:
              (lessonType === 'EXTERNAL_LINK' || lessonType === 'DOWNLOAD') &&
              externalUrl.trim()
                ? externalUrl.trim()
                : undefined,
            content:
              (lessonType === 'TEXT' || lessonType === 'DOCUMENT') && content.trim()
                ? content.trim()
                : undefined,
            durationSeconds,
            isMandatory,
            isPreview,
          },
        ],
      })) as { id: string } | undefined;

      const createdLessonId = newLesson?.id;

      if (createdLessonId && publishImmediately) {
        try {
          await publishLesson.mutateAsync({
            courseId,
            args: [createdLessonId],
          });
        } catch {
          toast.info('Lesson created as draft. You can publish it when ready.');
        }
      }

      if (
        createdLessonId &&
        attachResource &&
        resourceTitle.trim() &&
        resourceUrl.trim()
      ) {
        try {
          await createResource.mutateAsync({
            courseId,
            args: [
              createdLessonId,
              {
                title: resourceTitle.trim(),
                externalUrl: resourceUrl.trim(),
                visibility: 'ENROLLED_STUDENTS',
              },
            ],
          });
        } catch {
          toast.error('Lesson created, but initial resource could not be attached');
        }
      }

      toast.success(
        publishImmediately
          ? 'Lesson added and published'
          : 'Lesson added as draft',
      );
      resetForm();
      setOpen(false);
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not add this lesson');
      toast.error('Could not add this lesson', message);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetForm();
      }}
    >
      <Can permission="lessons.create">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Add lesson
        </Button>
      </Can>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New lesson</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Lesson Title</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 01. Introduction to the Topic"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lesson-type">Lesson Type</Label>
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

            <div className="space-y-2">
              <Label htmlFor="lesson-duration" className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                Estimated Duration (minutes)
              </Label>
              <Input
                id="lesson-duration"
                type="number"
                min="0"
                step="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="e.g., 15"
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
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or direct .mp4 URL"
                aria-invalid={Boolean(videoUrlError)}
              />
              {videoUrlError ? (
                <p className="text-xs text-destructive">{videoUrlError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Accepts YouTube links or direct HTTPS links to video files (.mp4, .webm, .mov).
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
              <Label htmlFor="lesson-content" className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-muted-foreground" />
                Lesson Content / Notes
              </Label>
              <Textarea
                id="lesson-content"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write lesson notes, markdown, or article content..."
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
              <Switch
                id="lesson-preview"
                checked={isPreview}
                onCheckedChange={setIsPreview}
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <div>
                <Label htmlFor="lesson-publish" className="font-medium cursor-pointer">
                  Publish Immediately
                </Label>
                <p className="text-xs text-muted-foreground">
                  Make this lesson visible immediately upon creation.
                </p>
              </div>
              <Switch
                id="lesson-publish"
                checked={publishImmediately}
                onCheckedChange={setPublishImmediately}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="size-4 text-muted-foreground" />
                <Label htmlFor="attach-resource" className="font-medium cursor-pointer">
                  Attach Initial Resource (Optional)
                </Label>
              </div>
              <Switch
                id="attach-resource"
                checked={attachResource}
                onCheckedChange={setAttachResource}
              />
            </div>

            {attachResource && (
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="res-title" className="text-xs">
                    Resource Title
                  </Label>
                  <Input
                    id="res-title"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    placeholder="e.g., Slide Deck PDF"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="res-url" className="text-xs">
                    External Link / File URL
                  </Label>
                  <Input
                    id="res-url"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !title.trim() ||
                Boolean(videoUrlError) ||
                Boolean(externalUrlError) ||
                isSaving
              }
            >
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {publishImmediately ? 'Add & Publish Lesson' : 'Add Lesson as Draft'}
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
  isCollapsed,
  onToggleCollapse,
}: {
  courseId: string;
  section: AdminCourseSection;
  sections: AdminCourseSection[];
  index: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const archiveSection = useArchiveSection();
  const reorderSections = useReorderSections();
  const reorderLessons = useReorderLessons();
  const moveLesson = useMoveLesson();
  const publishLesson = usePublishLesson();
  const unpublishLesson = useUnpublishLesson();
  const archiveLesson = useArchiveLesson();

  const publishedCount = section.lessons.filter(
    (l) => Boolean(l.isPublished || l.publishedAt),
  ).length;

  async function handleArchiveSection() {
    try {
      await archiveSection.mutateAsync({ courseId, args: [section.id] });
      toast.success('Section archived');
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not archive this section');
      toast.error('Could not archive this section', message);
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
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not reorder sections');
      toast.error('Could not reorder sections', message);
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
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not reorder lessons');
      toast.error('Could not reorder lessons', message);
    }
  }

  async function handleMoveLessonToSection(lessonId: string, targetSectionId: string) {
    if (targetSectionId === section.id) return;
    try {
      await moveLesson.mutateAsync({ courseId, args: [lessonId, targetSectionId, undefined] });
      toast.success('Lesson moved');
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not move this lesson');
      toast.error('Could not move this lesson', message);
    }
  }

  async function handleTogglePublish(lessonId: string, isPublished: boolean) {
    try {
      if (isPublished) await unpublishLesson.mutateAsync({ courseId, args: [lessonId] });
      else await publishLesson.mutateAsync({ courseId, args: [lessonId] });
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not update this lesson');
      toast.error('Could not update this lesson', message);
    }
  }

  async function handleArchiveLesson(lessonId: string) {
    try {
      await archiveLesson.mutateAsync({ courseId, args: [lessonId] });
      toast.success('Lesson archived');
    } catch (error) {
      const message = extractErrorMessage(error, 'Could not archive this lesson');
      toast.error('Could not archive this lesson', message);
    }
  }

  return (
    <Card className="transition-all duration-200">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand / Unhide section' : 'Collapse / Hide section'}
            title={isCollapsed ? 'Expand / Unhide section' : 'Collapse / Hide section'}
          >
            <ChevronDown
              className={cn(
                'size-4 transition-transform duration-200',
                isCollapsed && '-rotate-90',
              )}
            />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle
                className="text-base cursor-pointer hover:underline"
                onClick={onToggleCollapse}
              >
                {section.title}
              </CardTitle>
              <Badge variant="outline" className="text-xs font-normal">
                {section.lessons.length} {section.lessons.length === 1 ? 'lesson' : 'lessons'}
              </Badge>
              {publishedCount > 0 && (
                <Badge variant="success" className="text-xs font-normal">
                  {publishedCount} published
                </Badge>
              )}
              {isCollapsed && (
                <span className="text-xs text-muted-foreground italic">(hidden)</span>
              )}
            </div>
            {section.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {section.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            onClick={onToggleCollapse}
          >
            {isCollapsed ? 'Unhide' : 'Hide'}
          </Button>
          <EditSectionDialog courseId={courseId} section={section} />
          <Can permission="sections.reorder">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={index === 0 || reorderSections.isPending}
              onClick={() => handleMoveSection(-1)}
              aria-label="Move section up"
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={index === sections.length - 1 || reorderSections.isPending}
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

      {!isCollapsed && (
        <CardContent className="space-y-2 pt-0">
          {section.lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No lessons yet.</p>
          ) : (
            section.lessons.map((lesson, lessonIndex) => {
              const isLessonPublished = Boolean(lesson.isPublished || lesson.publishedAt);
              return (
                <div
                  key={lesson.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 bg-card/40 hover:bg-card/70 transition-colors"
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
                      {lesson.isPreview ? ' · Free Preview' : ''}
                      {lesson.resources?.length
                        ? ` · ${lesson.resources.length} ${lesson.resources.length === 1 ? 'resource' : 'resources'}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={isLessonPublished ? 'success' : 'secondary'} className="text-xs">
                      {isLessonPublished ? 'Published' : 'Draft'}
                    </Badge>
                    {isLessonPublished ? (
                      <Can permission="lessons.unpublish">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          disabled={
                            unpublishLesson.isPending &&
                            unpublishLesson.variables?.args[0] === lesson.id
                          }
                          onClick={() => handleTogglePublish(lesson.id, true)}
                        >
                          {unpublishLesson.isPending &&
                          unpublishLesson.variables?.args[0] === lesson.id ? (
                            <Loader2 className="mr-1 size-3 animate-spin" />
                          ) : null}
                          Unpublish
                        </Button>
                      </Can>
                    ) : (
                      <Can permission="lessons.publish">
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-xs font-medium"
                          disabled={
                            publishLesson.isPending &&
                            publishLesson.variables?.args[0] === lesson.id
                          }
                          onClick={() => handleTogglePublish(lesson.id, false)}
                        >
                          {publishLesson.isPending &&
                          publishLesson.variables?.args[0] === lesson.id ? (
                            <Loader2 className="mr-1 size-3 animate-spin" />
                          ) : null}
                          Publish
                        </Button>
                      </Can>
                    )}
                    <Can permission="lessons.reorder">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={lessonIndex === 0 || reorderLessons.isPending}
                        onClick={() => handleMoveLesson(lessonIndex, -1)}
                        aria-label="Move lesson up"
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={
                          lessonIndex === section.lessons.length - 1 || reorderLessons.isPending
                        }
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
                          disabled={
                            moveLesson.isPending && moveLesson.variables?.args[0] === lesson.id
                          }
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
              );
            })
          )}
          <div className="pt-1">
            <AddLessonDialog courseId={courseId} sectionId={section.id} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function AdminCourseCurriculumPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const courseQuery = useAdminCourse(courseId);
  const course = courseQuery.data;

  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  const allCollapsed =
    Boolean(course?.sections.length) &&
    (course?.sections.every((s) => collapsedMap[s.id]) ?? false);

  function toggleSection(sectionId: string) {
    setCollapsedMap((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }

  function handleToggleAllCollapse() {
    if (!course?.sections.length) return;
    const shouldCollapse = !allCollapsed;
    const nextMap: Record<string, boolean> = {};
    course.sections.forEach((s) => {
      nextMap[s.id] = shouldCollapse;
    });
    setCollapsedMap(nextMap);
  }

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
        actions={
          course && (
            <div className="flex items-center gap-2">
              {course.sections.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleToggleAllCollapse}
                >
                  <ChevronsUpDown className="size-4" />
                  {allCollapsed ? 'Unhide all sections' : 'Hide all sections'}
                </Button>
              )}
              <AddSectionDialog courseId={courseId} />
            </div>
          )
        }
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
                isCollapsed={Boolean(collapsedMap[section.id])}
                onToggleCollapse={() => toggleSection(section.id)}
              />
            ))}
        </div>
      )}
    </ContentContainer>
  );
}
