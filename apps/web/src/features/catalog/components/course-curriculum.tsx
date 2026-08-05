import { Lock, PlayCircle, FileText, Download, Link2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { formatDurationSeconds } from '@/lib/format';
import type { CourseLesson, CourseSection } from '../types/catalog.types';

const LESSON_ICONS: Record<CourseLesson['lessonType'], typeof PlayCircle> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  DOCUMENT: FileText,
  DOWNLOAD: Download,
  EXTERNAL_LINK: Link2,
};

function LessonRow({ lesson }: { lesson: CourseLesson }) {
  const Icon = LESSON_ICONS[lesson.lessonType];
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate text-sm text-foreground">{lesson.title}</span>
        {lesson.isPreview && (
          <Badge variant="info" className="shrink-0">
            Preview
          </Badge>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        {lesson.durationSeconds ? (
          <span>{formatDurationSeconds(lesson.durationSeconds)}</span>
        ) : null}
        {!lesson.isPreview && <Lock className="size-3.5" aria-label="Locked" />}
      </div>
    </div>
  );
}

export interface CourseCurriculumProps {
  sections: CourseSection[];
}

export function CourseCurriculum({ sections }: CourseCurriculumProps) {
  const firstSection = sections[0];
  if (!firstSection) return null;

  const lessonCount = sections.reduce((total, section) => total + section.lessons.length, 0);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Curriculum</h2>
        <span className="text-sm text-muted-foreground">
          {sections.length} sections • {lessonCount} lessons
        </span>
      </div>
      <Accordion
        type="multiple"
        defaultValue={[firstSection.id]}
        className="rounded-xl border border-border px-4"
      >
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger>
              <span className="flex flex-col items-start gap-0.5 text-left">
                <span>{section.title}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {section.lessons.length} lessons
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {section.description && (
                <p className="mb-2 text-sm text-muted-foreground">{section.description}</p>
              )}
              {section.lessons.map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
