'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Plus, X } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminCourse,
  useUpdateCourse,
  useUpdateCourseOutcomes,
  useUpdateCoursePricing,
  useUpdateCourseRequirements,
  useUpdateCourseSettings,
  useUpdateCourseVisibility,
} from '@/features/catalog/hooks/use-admin-courses';
import type { CourseAccessType, CourseDifficulty } from '@/features/catalog/types/catalog.types';
import type { CourseVisibility } from '@/features/catalog/types/admin-course.types';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/lib/toast';

const basicsSchema = z.object({
  title: z.string().trim().min(3).max(180),
  shortDescription: z.string().trim().min(10).max(500),
  description: z.string().trim().min(10).max(100000),
  presenterName: z.string().trim().max(180).optional().or(z.literal('')),
});
type BasicsValues = z.infer<typeof basicsSchema>;

function BasicsTab({
  courseId,
  course,
}: {
  courseId: string;
  course: {
    title: string;
    shortDescription: string;
    description: string;
    presenterName: string;
    difficulty: CourseDifficulty;
  };
}) {
  const updateCourse = useUpdateCourse();
  const [difficulty, setDifficulty] = useState<CourseDifficulty>(course.difficulty);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<BasicsValues>({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      title: course.title,
      shortDescription: course.shortDescription,
      description: course.description,
      presenterName: course.presenterName,
    },
  });

  async function onSubmit(values: BasicsValues) {
    try {
      await updateCourse.mutateAsync({
        courseId,
        input: {
          title: values.title.trim(),
          shortDescription: values.shortDescription.trim(),
          description: values.description.trim(),
          presenterName: values.presenterName?.trim() || undefined,
          difficulty,
        },
      });
      toast.success('Course details updated');
    } catch {
      toast.error('Could not update course details');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="presenterName">Instructor</Label>
        <Input id="presenterName" {...register('presenterName')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select
          value={difficulty}
          onValueChange={(value) => setDifficulty(value as CourseDifficulty)}
        >
          <SelectTrigger id="difficulty" className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BEGINNER">Beginner</SelectItem>
            <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
            <SelectItem value="ADVANCED">Advanced</SelectItem>
            <SelectItem value="ALL_LEVELS">All levels</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short description</Label>
        <Textarea id="shortDescription" rows={2} {...register('shortDescription')} />
        {errors.shortDescription && (
          <p className="text-sm text-destructive">{errors.shortDescription.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Full description</Label>
        <Textarea id="description" rows={6} {...register('description')} />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={(!isDirty && difficulty === course.difficulty) || updateCourse.isPending}
      >
        {updateCourse.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Save basics
      </Button>
    </form>
  );
}

function PricingTab({
  courseId,
  course,
}: {
  courseId: string;
  course: {
    accessType: CourseAccessType;
    price: string;
    discountPrice: string | null;
    currency: string;
  };
}) {
  const updatePricing = useUpdateCoursePricing();
  const [accessType, setAccessType] = useState<CourseAccessType>(course.accessType);
  const [price, setPrice] = useState(course.price);
  const [discountPrice, setDiscountPrice] = useState(course.discountPrice ?? '');
  const [currency, setCurrency] = useState(course.currency);

  async function handleSave() {
    try {
      await updatePricing.mutateAsync({
        courseId,
        input: { accessType, price: price || '0', discountPrice: discountPrice || null, currency },
      });
      toast.success('Pricing updated');
    } catch {
      toast.error('Could not update pricing');
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Access type</Label>
        <Select
          value={accessType}
          onValueChange={(value) => setAccessType(value as CourseAccessType)}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FREE">Free</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {accessType === 'PAID' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discountPrice">Discount price (optional)</Label>
            <Input
              id="discountPrice"
              type="number"
              step="0.01"
              min="0"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              maxLength={3}
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />
          </div>
        </div>
      )}
      <Button onClick={handleSave} disabled={updatePricing.isPending}>
        {updatePricing.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Save pricing
      </Button>
    </div>
  );
}

function VisibilityTab({
  courseId,
  course,
}: {
  courseId: string;
  course: { visibility: CourseVisibility; featured: boolean };
}) {
  const updateVisibility = useUpdateCourseVisibility();
  const [visibility, setVisibility] = useState<CourseVisibility>(course.visibility);
  const [featured, setFeatured] = useState(course.featured);

  async function handleSave() {
    try {
      await updateVisibility.mutateAsync({ courseId, input: { visibility, featured } });
      toast.success('Visibility updated');
    } catch {
      toast.error('Could not update visibility');
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Visibility</Label>
        <Select
          value={visibility}
          onValueChange={(value) => setVisibility(value as CourseVisibility)}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">Public</SelectItem>
            <SelectItem value="PRIVATE">Private</SelectItem>
            <SelectItem value="UNLISTED">Unlisted</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 sm:max-w-md">
        <div>
          <Label htmlFor="featured">Featured</Label>
          <p className="text-xs text-muted-foreground">Highlight on the public homepage.</p>
        </div>
        <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
      </div>
      <Button onClick={handleSave} disabled={updateVisibility.isPending}>
        {updateVisibility.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Save visibility
      </Button>
    </div>
  );
}

function SettingsTab({
  courseId,
  course,
}: {
  courseId: string;
  course: { certificateEnabled: boolean; capacity: number | null };
}) {
  const updateSettings = useUpdateCourseSettings();
  const [certificateEnabled, setCertificateEnabled] = useState(course.certificateEnabled);
  const [capacity, setCapacity] = useState(course.capacity?.toString() ?? '');

  async function handleSave() {
    try {
      await updateSettings.mutateAsync({
        courseId,
        input: {
          certificateEnabled,
          capacity: capacity ? Number(capacity) : null,
        },
      });
      toast.success('Settings updated');
    } catch {
      toast.error('Could not update settings');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 sm:max-w-md">
        <div>
          <Label htmlFor="certificateEnabled">Certificate on completion</Label>
          <p className="text-xs text-muted-foreground">
            Issue a certificate when a student finishes.
          </p>
        </div>
        <Switch
          id="certificateEnabled"
          checked={certificateEnabled}
          onCheckedChange={setCertificateEnabled}
        />
      </div>
      <div className="space-y-2 sm:max-w-64">
        <Label htmlFor="capacity">Enrollment capacity (optional)</Label>
        <Input
          id="capacity"
          type="number"
          min="1"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="Unlimited"
        />
      </div>
      <Button onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Save settings
      </Button>
    </div>
  );
}

function ListEditor({
  items,
  onSave,
  isSaving,
  placeholder,
}: {
  items: string[];
  onSave: (items: string[]) => void;
  isSaving: boolean;
  placeholder: string;
}) {
  const [values, setValues] = useState(items);

  return (
    <div className="space-y-3">
      {values.map((value, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={value}
            placeholder={placeholder}
            onChange={(e) =>
              setValues((prev) => prev.map((item, i) => (i === index ? e.target.value : item)))
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setValues((prev) => prev.filter((_, i) => i !== index))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setValues((prev) => [...prev, ''])}
      >
        <Plus className="size-4" /> Add item
      </Button>
      <div>
        <Button
          onClick={() => onSave(values.map((v) => v.trim()).filter(Boolean))}
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}

export default function AdminCourseEditPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseQuery = useAdminCourse(courseId);
  const updateOutcomes = useUpdateCourseOutcomes();
  const updateRequirements = useUpdateCourseRequirements();
  const course = courseQuery.data;

  async function handleSaveOutcomes(items: string[]) {
    try {
      await updateOutcomes.mutateAsync({ courseId, input: items });
      toast.success('Outcomes updated');
    } catch {
      toast.error('Could not update outcomes');
    }
  }

  async function handleSaveRequirements(items: string[]) {
    try {
      await updateRequirements.mutateAsync({ courseId, input: items });
      toast.success('Requirements updated');
    } catch {
      toast.error('Could not update requirements');
    }
  }

  if (courseQuery.isError) {
    return (
      <ContentContainer>
        <PageHeader title="Edit course" />
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
          { label: 'Edit' },
        ]}
      />
      <PageHeader title="Edit course" description={course?.title} />

      {courseQuery.isLoading || !course ? (
        <Skeleton className="h-96" />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="basics">
              <TabsList className="mb-6 flex-wrap">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="visibility">Visibility</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
              </TabsList>
              <TabsContent value="basics">
                <BasicsTab courseId={courseId} course={course} />
              </TabsContent>
              <TabsContent value="pricing">
                <PricingTab courseId={courseId} course={course} />
              </TabsContent>
              <TabsContent value="visibility">
                <VisibilityTab courseId={courseId} course={course} />
              </TabsContent>
              <TabsContent value="settings">
                <SettingsTab courseId={courseId} course={course} />
              </TabsContent>
              <TabsContent value="outcomes">
                <ListEditor
                  items={course.outcomes.map((o) => o.text)}
                  onSave={handleSaveOutcomes}
                  isSaving={updateOutcomes.isPending}
                  placeholder="What will students learn?"
                />
              </TabsContent>
              <TabsContent value="requirements">
                <ListEditor
                  items={course.requirements.map((r) => r.text)}
                  onSave={handleSaveRequirements}
                  isSaving={updateRequirements.isPending}
                  placeholder="What do students need before starting?"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Button
        variant="outline"
        onClick={() => router.push(ROUTES.admin.academicsCourseDetail(courseId))}
      >
        Back to course
      </Button>
    </ContentContainer>
  );
}
