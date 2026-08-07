import { Download, ExternalLink, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatFileSize } from '@/lib/format';
import type { LessonContent } from '../types/learning.types';

export function LessonTabs({ lesson }: { lesson: LessonContent }) {
  return (
    <Tabs defaultValue="description" className="mt-6">
      <TabsList className="bg-white/5 text-sidebar-foreground/70">
        <TabsTrigger
          value="description"
          className="data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground"
        >
          Description
        </TabsTrigger>
        <TabsTrigger
          value="resources"
          className="gap-1.5 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground"
        >
          Resources
          {lesson.resources.length > 0 && (
            <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]">
              {lesson.resources.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-5 max-w-3xl">
        {lesson.content ? (
          <div
            className="prose prose-sm prose-invert max-w-none text-sidebar-foreground/80"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        ) : lesson.lessonType === 'EXTERNAL_LINK' && lesson.externalUrl ? (
          <a
            href={lesson.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-sidebar-primary hover:underline"
          >
            <ExternalLink className="size-4" />
            Open external resource
          </a>
        ) : (
          <p className="text-sm text-sidebar-foreground/60">
            This lesson has no written description.
          </p>
        )}
      </TabsContent>

      <TabsContent value="resources" className="mt-5 max-w-3xl">
        {lesson.resources.length === 0 ? (
          <p className="text-sm text-sidebar-foreground/60">No resources for this lesson.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {lesson.resources.map((resource) => {
              const body = (
                <>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sidebar-foreground/70">
                    <FileText className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">
                      {resource.label}
                    </span>
                    {resource.fileSize !== null && (
                      <span className="text-xs text-sidebar-foreground/50">
                        {formatFileSize(resource.fileSize)}
                      </span>
                    )}
                  </span>
                </>
              );
              return resource.externalUrl ? (
                <a
                  key={resource.id}
                  href={resource.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-white/5 p-3 transition-colors hover:border-sidebar-primary"
                >
                  {body}
                  <Download
                    className="size-4 shrink-0 text-sidebar-foreground/50"
                    aria-hidden="true"
                  />
                </a>
              ) : (
                <div
                  key={resource.id}
                  className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-white/5 p-3 opacity-70"
                  title="Contact your instructor to access this file"
                >
                  {body}
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
