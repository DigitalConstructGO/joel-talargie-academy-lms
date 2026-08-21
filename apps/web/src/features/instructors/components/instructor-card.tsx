'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import type { Instructor } from '../types/instructor.types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name.trim().slice(0, 2) || 'IN').toUpperCase();
}

export function InstructorCard({ instructor }: { instructor: Instructor }) {
  const [imgError, setImgError] = useState(false);
  const photo = instructor.photoUrl || instructor.avatarUrl;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md hover:border-brand/30">
      <Link
        href={ROUTES.instructors.detail(encodeURIComponent(instructor.name))}
        className="flex flex-col items-center gap-3 p-6 text-center"
      >
        {photo && !imgError ? (
          <div className="relative size-18 overflow-hidden rounded-full border-2 border-brand/30 shadow-xs transition-transform group-hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={instructor.name}
              className="size-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <span className="flex size-18 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-brand text-white font-bold text-base shadow-xs group-hover:scale-105 transition-transform">
            {getInitials(instructor.name)}
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors">
            {instructor.name}
          </h3>
          {instructor.title && (
            <p className="mt-0.5 text-[11px] font-medium text-brand">{instructor.title}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {instructor.courseCount} {instructor.courseCount === 1 ? 'course' : 'courses'}
          </p>
        </div>
      </Link>
    </Card>
  );
}
