import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import type { InstructorProfile } from '@/features/instructors/types/instructor.types';

export function MentorSpotlightSection({
  instructor,
}: {
  instructor: {
    name: string;
    title?: string;
    headline?: string;
    bio: string;
    photoUrl?: string | null;
    avatarUrl?: string | null;
    slug?: string;
    achievements?: string[];
    avatarColor?: string;
  } | null;
}) {
  if (!instructor) return null;

  const initials = instructor.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');

  const photo = instructor.photoUrl || instructor.avatarUrl;
  const subtitle = instructor.title || instructor.headline || 'Founder & Lead Instructor';
  const achievements =
    instructor.achievements && instructor.achievements.length > 0
      ? instructor.achievements
      : [
          'Over 10+ years of high-scale software engineering leadership',
          'Curriculum designed specifically for career placement & promotion',
          'Trained and certified thousands of engineers across the continent',
        ];
  const slug = instructor.slug || 'joel-talargie';

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16">
        {photo ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-muted">
            <Image
              src={photo}
              alt={instructor.name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className={cn(
              'flex aspect-square w-full items-center justify-center rounded-3xl bg-linear-to-br from-emerald-600 to-emerald-900 text-8xl font-bold text-white/90 shadow-xl',
              instructor.avatarColor,
            )}
          >
            {initials}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <span className="w-fit rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            Meet your mentor
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {instructor.name}
          </h2>
          <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{instructor.bio}</p>
          <ul className="flex flex-col gap-2">
            {achievements.slice(0, 3).map((achievement) => (
              <li key={achievement} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                {achievement}
              </li>
            ))}
          </ul>
          <Button asChild className="w-fit" variant="outline">
            <Link href={ROUTES.instructors.detail(slug)}>
              View full profile
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
