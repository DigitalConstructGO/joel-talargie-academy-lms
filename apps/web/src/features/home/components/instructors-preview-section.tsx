import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstructorProfileCard } from '@/features/instructors/components/instructor-profile-card';
import type { InstructorProfile } from '@/features/instructors/types/instructor.types';
import { ROUTES } from '@/constants/routes';

export function InstructorsPreviewSection({ instructors }: { instructors: InstructorProfile[] }) {
  if (instructors.length === 0) return null;

  return (
    <section className="border-t border-border bg-muted/20">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Learn from the best
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Industry professionals with real, hands-on experience.
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={ROUTES.instructors.list}>
              View all instructors
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {instructors.map((instructor) => (
            <InstructorProfileCard key={instructor.id} instructor={instructor} />
          ))}
        </div>
      </div>
    </section>
  );
}
