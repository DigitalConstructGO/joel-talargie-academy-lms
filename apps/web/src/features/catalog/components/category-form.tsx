'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter a category name.').max(120),
  slug: z
    .string()
    .trim()
    .max(140)
    .regex(slugPattern, 'Use lowercase letters, numbers, and hyphens only.')
    .optional()
    .or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  parentId: z.string().optional(),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export interface CategoryFormProps {
  defaultValues: CategoryFormValues;
  onSubmit: (values: CategoryFormValues) => void | Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel: () => void;
  excludeCategoryId?: string;
}

export function CategoryForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  onCancel,
  excludeCategoryId,
}: CategoryFormProps) {
  const parentOptionsQuery = useAdminCategories({ pageSize: 100 });
  const parentOptions = (parentOptionsQuery.data?.items ?? []).filter(
    (category) => category.id !== excludeCategoryId,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  });

  const isActive = watch('isActive');
  const parentId = watch('parentId');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} placeholder="Web Development" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input id="slug" {...register('slug')} placeholder="web-development" />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" rows={3} {...register('description')} />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentId">Parent category (optional)</Label>
            <Select
              value={parentId || '__none__'}
              onValueChange={(value) =>
                setValue('parentId', value === '__none__' ? '' : value, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="parentId">
                <SelectValue placeholder="No parent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No parent</SelectItem>
                {parentOptions.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <Label htmlFor="isActive">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive categories are hidden from the public catalog.
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked, { shouldDirty: true })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
