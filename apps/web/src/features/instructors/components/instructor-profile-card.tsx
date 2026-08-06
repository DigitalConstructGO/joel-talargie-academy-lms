import Link from 'next/link';
import { Star, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCompactNumber } from '@/lib/format';
import { ROUTES } from '@/constants/routes';
import { InstructorAvatar } from './instructor-avatar';
import type { InstructorProfile } from '../types/instructor.types';

export function InstructorProfileCard({ instructor }: { instructor: InstructorProfile }) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link
        href={ROUTES.instructors.detail(instructor.slug)}
        className="flex flex-col items-center gap-3 p-6 text-center"
      >
        <InstructorAvatar instructor={instructor} size={64} />
        <div>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-brand">
            {instructor.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{instructor.title}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-warning text-warning" />
            {instructor.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {formatCompactNumber(instructor.studentsCount)}
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {instructor.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-[11px]">
              {skill}
            </Badge>
          ))}
        </div>
      </Link>
    </Card>
  );
}
