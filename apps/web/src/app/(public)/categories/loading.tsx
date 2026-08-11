import { PageHeaderSkeleton } from '@/components/skeletons';
import { CategoryGridSkeleton } from '@/features/catalog/components/category-card-skeleton';

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
      <PageHeaderSkeleton />
      <CategoryGridSkeleton />
    </div>
  );
}
