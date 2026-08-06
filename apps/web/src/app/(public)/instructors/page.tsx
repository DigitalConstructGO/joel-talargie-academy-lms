import type { Metadata } from 'next';
import { UserRound } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { JsonLd } from '@/components/common/json-ld';
import { buildItemListJsonLd } from '@/lib/json-ld';
import { ROUTES } from '@/constants/routes';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { CATALOG_DATA_SOURCE } from '@/config/data-source.config';
import { deriveInstructors } from '@/features/instructors/utils/derive-instructors';
import { InstructorCard } from '@/features/instructors/components/instructor-card';
import { InstructorProfileCard } from '@/features/instructors/components/instructor-profile-card';
import { MOCK_INSTRUCTORS } from '@/features/instructors/data/mock-instructors.data';

export const metadata: Metadata = {
  title: 'Instructors',
  description: 'Meet the instructors teaching on the platform.',
};

export default async function InstructorsPage() {
  const isMock = CATALOG_DATA_SOURCE === 'mock';
  const instructors = isMock ? MOCK_INSTRUCTORS : null;
  const derivedInstructors = isMock
    ? []
    : deriveInstructors((await catalogApi.listCourses({ pageSize: 100, sort: 'newest' })).items);

  const isEmpty = isMock ? instructors!.length === 0 : derivedInstructors.length === 0;
  const itemListEntries = isMock
    ? instructors!.map((instructor) => ({
        name: instructor.name,
        url: ROUTES.instructors.detail(instructor.slug),
      }))
    : derivedInstructors.map((instructor) => ({
        name: instructor.name,
        url: ROUTES.instructors.detail(encodeURIComponent(instructor.name)),
      }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
      {itemListEntries.length > 0 && <JsonLd data={buildItemListJsonLd(itemListEntries)} />}
      <PageHeader title="Instructors" description="Meet the people behind our courses." />
      {isEmpty ? (
        <EmptyState icon={UserRound} title="No instructors yet" />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {isMock
            ? instructors!.map((instructor) => (
                <InstructorProfileCard key={instructor.id} instructor={instructor} />
              ))
            : derivedInstructors.map((instructor) => (
                <InstructorCard key={instructor.name} instructor={instructor} />
              ))}
        </div>
      )}
    </div>
  );
}
