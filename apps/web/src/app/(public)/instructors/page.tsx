import type { Metadata } from 'next';
import { UserRound } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { deriveInstructors } from '@/features/instructors/utils/derive-instructors';
import { InstructorCard } from '@/features/instructors/components/instructor-card';

export const metadata: Metadata = {
  title: 'Instructors',
  description: 'Meet the instructors teaching on the platform.',
};

export default async function InstructorsPage() {
  const courses = await catalogApi.listCourses({ pageSize: 100, sort: 'newest' });
  const instructors = deriveInstructors(courses.items);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
      <PageHeader title="Instructors" description="Meet the people behind our courses." />
      {instructors.length === 0 ? (
        <EmptyState icon={UserRound} title="No instructors yet" />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {instructors.map((instructor) => (
            <InstructorCard key={instructor.name} instructor={instructor} />
          ))}
        </div>
      )}
    </div>
  );
}
