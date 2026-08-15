'use client';

import { useState } from 'react';
import { Check, CheckCircle2, ChevronDown, ChevronRight, Circle, Clock, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDurationSeconds } from '@/lib/format';
import type { CurriculumSection } from '../types/learning.types';

interface LessonSidebarProps {
  curriculum: CurriculumSection[];
  currentLessonId: string | undefined;
  overallProgress: number;
  onSelectLesson: (lessonId: string) => void;
}

export function LessonSidebar({
  curriculum,
  currentLessonId,
  overallProgress,
  onSelectLesson,
}: LessonSidebarProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  function toggleSection(id: string) {
    setCollapsedSections((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const circumference = 2 * Math.PI * 15.9155;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between gap-4 border-b border-sidebar-border p-5">
        <div>
          <h2 className="text-sm font-bold text-white">Course Content</h2>
          <p className="mt-1 text-xs text-sidebar-foreground/60">{overallProgress}% completed</p>
        </div>
        <div className="relative size-10 shrink-0">
          <svg className="size-10 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-white/10"
            />
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * overallProgress) / 100}
              strokeLinecap="round"
              className="text-sidebar-primary"
            />
          </svg>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3" aria-label="Course lessons">
        {curriculum.map((section) => {
          const collapsed = collapsedSections.has(section.id);
          const completedCount = section.lessons.filter(
            (lesson) => lesson.progressStatus === 'COMPLETED',
          ).length;
          const isSectionComplete =
            section.lessons.length > 0 && completedCount === section.lessons.length;

          return (
            <div key={section.id} className="mb-1">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-sidebar-accent"
                aria-expanded={!collapsed}
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white">
                  {collapsed ? (
                    <ChevronRight className="size-4 shrink-0 text-sidebar-foreground/50" />
                  ) : (
                    <ChevronDown className="size-4 shrink-0 text-sidebar-foreground/50" />
                  )}
                  <span className="truncate">{section.title}</span>
                </span>
                {isSectionComplete ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-medium text-brand">
                    <Check className="size-3" />
                    <span>Completed</span>
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-sidebar-foreground/60">
                    {completedCount}/{section.lessons.length}
                  </span>
                )}
              </button>
              {!collapsed && (
                <div className="space-y-0.5">
                  {section.lessons.map((lesson) => {
                    const isActive = lesson.id === currentLessonId;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => onSelectLesson(lesson.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={cn(
                          'flex w-full items-center gap-3 border-l-2 py-2.5 pl-9 pr-4 text-left text-sm transition-colors',
                          isActive
                            ? 'border-sidebar-primary bg-white/5 text-white'
                            : 'border-transparent text-sidebar-foreground/70 hover:bg-white/5',
                        )}
                      >
                        {lesson.progressStatus === 'COMPLETED' ? (
                          <CheckCircle2 className="size-4 shrink-0 text-brand" />
                        ) : lesson.progressStatus === 'IN_PROGRESS' ? (
                          <Clock className="size-4 shrink-0 text-amber-400" />
                        ) : isActive ? (
                          <PlayCircle className="size-4 shrink-0 text-sidebar-primary" />
                        ) : (
                          <Circle className="size-4 shrink-0 text-sidebar-foreground/30" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                        {lesson.durationSeconds && (
                          <span className="shrink-0 text-[10px] text-sidebar-foreground/50">
                            {formatDurationSeconds(lesson.durationSeconds)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
