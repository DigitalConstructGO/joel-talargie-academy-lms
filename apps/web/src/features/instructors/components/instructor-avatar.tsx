'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { InstructorProfile } from '../types/instructor.types';

export interface InstructorAvatarProps {
  instructor: Pick<InstructorProfile, 'name' | 'avatarColor' | 'photoUrl'>;
  size?: number;
  className?: string;
}

export function InstructorAvatar({ instructor, size = 64, className }: InstructorAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = instructor.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');

  if (instructor.photoUrl && !imageFailed) {
    return (
      <span
        className={cn('relative block shrink-0 overflow-hidden rounded-full', className)}
        style={{ width: size, height: size }}
      >
        <Image
          src={instructor.photoUrl}
          alt={instructor.name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-linear-to-br font-semibold text-white',
        instructor.avatarColor,
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </span>
  );
}
