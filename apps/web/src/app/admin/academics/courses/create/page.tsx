'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/common/page-header';
import { PageBreadcrumb } from '@/components/common/page-breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ROUTES } from '@/constants/routes';
import { extractFieldErrors } from '@/lib/api/api-error';
import { toast } from '@/lib/toast';

const formSchema = z.object({
  title: z.string().trim().min(3, 'Enter a course title.').max(180),
  categoryId: z.string().min(1, 'Select a category.'),
  shortDescription: z.string().trim().min(10, 'At least 10 characters.').max(500),
  description: z.string().trim().min(10, 'At least 10 characters.').max(100000),
  presenterName: z.string().trim().max(180).optional().or(z.literal('')),
  accessType: z.enum(['FREE', 'PAID']),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']),
  price: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminCourseCreatePage() {
  const router = useRouter();
  const categoriesQuery = useAdminCategories({ pageSize: 100, isActive: true });
  const createCourse = useCreateCourse();

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
      price: '',
    },
  });

  const accessType = watch('accessType');
  const difficulty = watch('difficulty');
  const categoryId = watch('categoryId');

  async function onSubmit(values: FormValues) {
    try {
      const course = await createCourse.mutateAsync({
        title: values.title.trim(),
        categoryId: values.categoryId,
        shortDescription: values.shortDescription.trim(),
        description: values.description.trim(),
        presenterName: values.presenterName?.trim() || undefined,
        accessType: values.accessType,
        difficulty: values.difficulty,
        price: values.accessType === 'PAID' ? values.price?.trim() || '0' : undefined,
      });
      toast.success('Course created as a draft');
      router.push(ROUTES.admin.academicsCourseDetail(course.id));
    } catch (error) {
      const fieldErrors = extractFieldErrors(error);
      for (const { field, message } of fieldErrors) {
        setError(field as keyof FormValues, { message });
      }
      toast.error('Could not create this course');
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
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
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
                <Label htmlFor="price">Price (USD)</Label>
                <Input id="price" type="number" step="0.01" min="0" {...register('price')} />
              </div>
            )}
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
