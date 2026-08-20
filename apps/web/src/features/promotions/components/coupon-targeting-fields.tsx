'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAdminCategories } from '@/features/catalog/hooks/use-admin-categories';
import { useCourses } from '@/features/catalog/hooks/use-courses';

export type CouponTargetType = 'ALL' | 'CATEGORIES' | 'COURSES';

export interface CouponTargetingFieldsProps {
  targetType: CouponTargetType;
  onTargetTypeChange: (targetType: CouponTargetType) => void;
  selectedCategoryIds: string[];
  onCategoryIdsChange: (categoryIds: string[]) => void;
  selectedCourseIds: string[];
  onCourseIdsChange: (courseIds: string[]) => void;
}

const TARGET_TYPE_OPTIONS: {
  value: CouponTargetType;
  label: string;
  description: string;
}[] = [
  {
    value: 'ALL',
    label: 'All Courses',
    description: 'Valid for any eligible paid course.',
  },
  {
    value: 'CATEGORIES',
    label: 'Categories',
    description: 'Valid only for courses in the selected categories.',
  },
  {
    value: 'COURSES',
    label: 'Specific Courses',
    description: 'Valid only for the selected courses.',
  },
];

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id];
}

export function CouponTargetingFields({
  targetType,
  onTargetTypeChange,
  selectedCategoryIds,
  onCategoryIdsChange,
  selectedCourseIds,
  onCourseIdsChange,
}: CouponTargetingFieldsProps) {
  const [courseSearch, setCourseSearch] = useState('');
  const categoriesQuery = useAdminCategories({ pageSize: 100, isActive: true });
  const coursesQuery = useCourses({ pageSize: 100, sort: 'title_asc' });

  const categories = categoriesQuery.data?.items ?? [];
  const courses = coursesQuery.data?.items ?? [];

  const visibleCourses = courseSearch.trim()
    ? courses.filter((course) =>
        course.title.toLowerCase().includes(courseSearch.trim().toLowerCase()),
      )
    : courses;

  return (
    <div className="space-y-4">
      <RadioGroup
        value={targetType}
        onValueChange={(value) => onTargetTypeChange(value as CouponTargetType)}
        className="grid gap-2 sm:grid-cols-3"
      >
        {TARGET_TYPE_OPTIONS.map((option) => (
          <Label
            key={option.value}
            className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
          >
            <span className="flex items-center gap-2">
              <RadioGroupItem value={option.value} id={`target-${option.value}`} />
              <span className="text-sm font-medium text-foreground">{option.label}</span>
            </span>
            <span className="text-xs text-muted-foreground">{option.description}</span>
          </Label>
        ))}
      </RadioGroup>

      {targetType === 'CATEGORIES' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Categories</Label>
            <Badge variant="secondary">{selectedCategoryIds.length} selected</Badge>
          </div>
          <div className="rounded-lg border border-border">
            <ScrollArea className="h-56">
              <div className="space-y-0.5 p-2">
                {categoriesQuery.isLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <Skeleton key={index} className="h-8" />
                    ))
                  : categories.map((category) => {
                      const checked = selectedCategoryIds.includes(category.id);
                      return (
                        <div
                          key={category.id}
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            onCategoryIdsChange(toggleId(selectedCategoryIds, category.id))
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onCategoryIdsChange(toggleId(selectedCategoryIds, category.id));
                            }
                          }}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              onCategoryIdsChange(toggleId(selectedCategoryIds, category.id))
                            }
                            className="pointer-events-none"
                          />
                          <span
                            className={checked ? 'font-medium text-foreground' : 'text-foreground'}
                          >
                            {category.name}
                          </span>
                        </div>
                      );
                    })}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {targetType === 'COURSES' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Courses</Label>
            <Badge variant="secondary">{selectedCourseIds.length} selected</Badge>
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={courseSearch}
              onChange={(event) => setCourseSearch(event.target.value)}
              placeholder="Search courses…"
              className="pl-9"
            />
          </div>
          <div className="rounded-lg border border-border">
            <ScrollArea className="h-64">
              <div className="space-y-0.5 p-2">
                {coursesQuery.isLoading
                  ? Array.from({ length: 6 }, (_, index) => (
                      <Skeleton key={index} className="h-8" />
                    ))
                  : visibleCourses.map((course) => {
                      const checked = selectedCourseIds.includes(course.id);
                      return (
                        <div
                          key={course.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onCourseIdsChange(toggleId(selectedCourseIds, course.id))}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onCourseIdsChange(toggleId(selectedCourseIds, course.id));
                            }
                          }}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              onCourseIdsChange(toggleId(selectedCourseIds, course.id))
                            }
                            className="pointer-events-none"
                          />
                          <span className="min-w-0 flex-1 truncate text-foreground">
                            {course.title}
                          </span>
                          <Badge variant="outline" className="shrink-0">
                            {course.accessType === 'FREE' ? 'Free' : 'Paid'}
                          </Badge>
                        </div>
                      );
                    })}
                {!coursesQuery.isLoading && visibleCourses.length === 0 && (
                  <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No courses match &ldquo;{courseSearch}&rdquo;.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
