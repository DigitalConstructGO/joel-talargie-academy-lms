'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Plus, X } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminCategories } from '@/features/catalog/hooks/use-admin-categories';
import { useCreateCourse } from '@/features/catalog/hooks/use-admin-courses';
import { CourseThumbnailUploader } from '@/features/catalog/components/course-thumbnail-uploader';
import type { CourseVisibility } from '@/features/catalog/types/admin-course.types';
import { ROUTES } from '@/constants/routes';
import { extractErrorMessage, extractFieldErrors } from '@/lib/api/api-error';
import { toast } from '@/lib/toast';

const formSchema = z
  .object({
    title: z.string().trim().min(3, 'Enter a course title.').max(180),
    categoryId: z.string().min(1, 'Select a category.'),
    shortDescription: z.string().trim().min(10, 'At least 10 characters.').max(500),
    description: z.string().trim().min(10, 'At least 10 characters.').max(100000),
    presenterName: z.string().trim().max(180).optional().or(z.literal('')),
    accessType: z.enum(['FREE', 'PAID']),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']),
    visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']),
    featured: z.boolean().optional(),
    certificateEnabled: z.boolean().optional(),
    price: z.string().optional(),
    estimatedDurationMinutes: z.string().optional().or(z.literal('')),
    capacity: z.string().optional().or(z.literal('')),
  })
  .refine((values) => values.accessType === 'FREE' || Boolean(values.price?.trim()), {
    path: ['price'],
    message: 'Enter a price for paid courses.',
  });

type FormValues = z.infer<typeof formSchema>;

function ItemListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((value, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={value ?? ''}
            placeholder={placeholder}
            onChange={(e) =>
              onChange(items.map((item, i) => (i === index ? e.target.value : (item ?? ''))))
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
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
        onClick={() => onChange([...items, ''])}
      >
        <Plus className="size-4" /> Add item
      </Button>
    </div>
  );
}

export default function AdminCourseCreatePage() {
  const router = useRouter();
  const categoriesQuery = useAdminCategories({ pageSize: 100, isActive: true });
  const createCourse = useCreateCourse();
  const [thumbnailKey, setThumbnailKey] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['']);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      categoryId: '',
      shortDescription: '',
      description: '',
      presenterName: '',
      accessType: 'FREE',
      difficulty: 'ALL_LEVELS',
      visibility: 'PUBLIC',
      featured: false,
      certificateEnabled: false,
      price: '',
      estimatedDurationMinutes: '',
      capacity: '',
    },
  });

  const accessType = watch('accessType');
  const difficulty = watch('difficulty');
  const visibility = watch('visibility');
  const categoryId = watch('categoryId');
  const featured = watch('featured') ?? false;
  const certificateEnabled = watch('certificateEnabled') ?? false;
  const courseTitle = watch('title');

  const selectedCategory = (categoriesQuery.data?.items ?? []).find(
    (category) => category.id === categoryId,
  );

  async function onSubmit(values: FormValues) {
    try {
      const course = await createCourse.mutateAsync({
        title: values.title.trim(),
        categoryId: values.categoryId,
        shortDescription: values.shortDescription.trim(),
        description: values.description.trim(),
        thumbnailKey: thumbnailKey ?? undefined,
        presenterName: values.presenterName?.trim() || undefined,
        accessType: values.accessType,
        difficulty: values.difficulty,
        visibility: values.visibility,
        currency: 'ETB',
        featured,
        certificateEnabled,
        price: values.accessType === 'PAID' ? values.price?.trim() || '0' : undefined,
        estimatedDurationMinutes: values.estimatedDurationMinutes
          ? Number(values.estimatedDurationMinutes)
          : undefined,
        capacity: values.capacity ? Number(values.capacity) : undefined,
        outcomes: outcomes.map((item) => (item ?? '').trim()).filter(Boolean),
        requirements: requirements.map((item) => (item ?? '').trim()).filter(Boolean),
      });
      toast.success('Course created as a draft');
      router.push(ROUTES.admin.academicsCourseDetail(course.id));
    } catch (error) {
      const fieldErrors = extractFieldErrors(error);
      for (const { field, message } of fieldErrors) {
        setError(field as keyof FormValues, { message });
      }
      const message = extractErrorMessage(error, 'Could not create this course');
      toast.error('Could not create this course', message);
    }
  }

  return (
    <ContentContainer>
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: ROUTES.admin.root },
          { label: 'Academic Management', href: ROUTES.admin.academics },
          { label: 'Courses', href: ROUTES.admin.academicsCourses },
          { label: 'New course' },
        ]}
      />
      <PageHeader
        title="New course"
        description="Add a course to the catalog. It's created as a draft."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} placeholder="Modern React Development" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => setValue('categoryId', value, { shouldValidate: true })}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(categoriesQuery.data?.items ?? []).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="presenterName">Instructor (optional)</Label>
              <Input id="presenterName" {...register('presenterName')} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="shortDescription">Short description</Label>
              <Textarea id="shortDescription" rows={2} {...register('shortDescription')} />
              {errors.shortDescription && (
                <p className="text-sm text-destructive">{errors.shortDescription.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Full description</Label>
              <Textarea id="description" rows={5} {...register('description')} />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(value) => setValue('difficulty', value as FormValues['difficulty'])}
              >
                <SelectTrigger id="difficulty">
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
              <Label htmlFor="estimatedDurationMinutes">
                Estimated duration (minutes, optional)
              </Label>
              <Input
                id="estimatedDurationMinutes"
                type="number"
                min="0"
                {...register('estimatedDurationMinutes')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Course thumbnail (optional)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CourseThumbnailUploader
              value={thumbnailKey}
              onChange={setThumbnailKey}
              title={courseTitle || 'Course thumbnail'}
              categorySlug={selectedCategory?.slug}
              categoryName={selectedCategory?.name}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Access & pricing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="accessType">Access</Label>
              <Select
                value={accessType}
                onValueChange={(value) => setValue('accessType', value as FormValues['accessType'])}
              >
                <SelectTrigger id="accessType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {accessType === 'PAID' && (
              <div className="space-y-2">
                <Label htmlFor="price">Price (ETB)</Label>
                <Input id="price" type="number" step="0.01" min="0" {...register('price')} />
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visibility & settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={visibility}
                  onValueChange={(value) =>
                    setValue('visibility', value as CourseVisibility, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="UNLISTED">Unlisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Enrollment capacity (optional)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  {...register('capacity')}
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 sm:max-w-md">
              <div>
                <Label htmlFor="featured">Featured</Label>
                <p className="text-xs text-muted-foreground">Highlight on the public homepage.</p>
              </div>
              <Switch
                id="featured"
                checked={featured}
                onCheckedChange={(checked) =>
                  setValue('featured', checked, { shouldDirty: true, shouldValidate: true })
                }
              />
            </div>
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
                onCheckedChange={(checked) =>
                  setValue('certificateEnabled', checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Learning outcomes & requirements</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 pt-0 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>What will students learn?</Label>
              <ItemListEditor
                items={outcomes}
                onChange={setOutcomes}
                placeholder="e.g. Build a REST API with NestJS"
              />
            </div>
            <div className="space-y-2">
              <Label>What do students need before starting?</Label>
              <ItemListEditor
                items={requirements}
                onChange={setRequirements}
                placeholder="e.g. Basic JavaScript knowledge"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={createCourse.isPending}>
            {createCourse.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create course
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.academicsCourses)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ContentContainer>
  );
}
