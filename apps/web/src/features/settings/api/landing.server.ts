import { cache } from 'react';
import type { PublicLandingData } from '../types/settings.types';

export const getLandingPageDataServer = cache(async (): Promise<PublicLandingData | null> => {
  try {
    const baseUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:4000/api/v1';
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/public/landing`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as PublicLandingData;
  } catch {
    return null;
  }
});

