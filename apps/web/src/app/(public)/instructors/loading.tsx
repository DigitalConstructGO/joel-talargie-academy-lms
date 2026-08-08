import { PageHeaderSkeleton, InstructorGridSkeleton } from '@/components/skeletons';

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
      <PageHeaderSkeleton />
      <InstructorGridSkeleton count={10} />
    </div>
  );
}
