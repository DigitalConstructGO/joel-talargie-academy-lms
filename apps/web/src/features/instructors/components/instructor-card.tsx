import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import type { Instructor } from '../types/instructor.types';

export function InstructorCard({ instructor }: { instructor: Instructor }) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link
        href={ROUTES.instructors.detail(encodeURIComponent(instructor.name))}
        className="flex flex-col items-center gap-3 p-6 text-center"
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand">
          <UserRound className="size-7" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-brand">
            {instructor.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {instructor.courseCount} {instructor.courseCount === 1 ? 'course' : 'courses'}
          </p>
        </div>
      </Link>
    </Card>
  );
}
