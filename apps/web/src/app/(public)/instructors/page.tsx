import type { Metadata } from 'next';
import { UserRound } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { JsonLd } from '@/components/common/json-ld';
import { buildItemListJsonLd } from '@/lib/json-ld';
import { ROUTES } from '@/constants/routes';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { deriveInstructors } from '@/features/instructors/utils/derive-instructors';
import { InstructorCard } from '@/features/instructors/components/instructor-card';

import { usersApi } from '@/features/users/api/users.api';

export const metadata: Metadata = {
  title: 'Instructors',
  description: 'Meet the instructors teaching on the platform.',
};

async function loadInstructors() {
  try {
    const [coursesRes, usersRes] = await Promise.allSettled([
      catalogApi.listCourses({ pageSize: 100, sort: 'newest' }),
      usersApi.list({ pageSize: 100 }),
    ]);

    const courses = coursesRes.status === 'fulfilled' ? coursesRes.value.items : [];
    const instructorUsers =
      usersRes.status === 'fulfilled'
        ? usersRes.value.items.map((u) => ({
            name: (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).trim() || u.email,
            photoUrl: u.avatarUrl || undefined,
            avatarUrl: u.avatarUrl || undefined,
            bio: u.bio || undefined,
          }))
        : [];

    return deriveInstructors(courses, instructorUsers);
  } catch {
    return deriveInstructors([]);
  }
}

import { InstructorsPageHeader } from '@/features/instructors/components/instructors-page-header';

export default async function InstructorsPage() {
  const instructors = await loadInstructors();

  const itemListEntries = instructors.map((instructor) => ({
    name: instructor.name,
    url: ROUTES.instructors.detail(encodeURIComponent(instructor.name)),
  }));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6">
      {itemListEntries.length > 0 && <JsonLd data={buildItemListJsonLd(itemListEntries)} />}
      <InstructorsPageHeader />
      {instructors.length === 0 ? (
        <EmptyState icon={UserRound} title="No instructors found" />
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
