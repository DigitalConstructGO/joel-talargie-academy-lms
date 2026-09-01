'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

import { useLanguage } from '@/lib/i18n/language-provider';

const ANNOUNCEMENT_ID = 'summer-2026-launch';
const STORAGE_KEY = `joel-academy-announcement-dismissed-${ANNOUNCEMENT_ID}`;

export function AnnouncementBar() {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === '1') setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-brand px-4 py-2 text-center text-xs font-medium text-brand-foreground sm:text-sm">
      <span>
        {t('hero.badge')}{' '}
        <Link
          href={ROUTES.courses.list}
          className="underline underline-offset-2 hover:no-underline"
        >
          {t('hero.ctaBrowse')}
        </Link>
      </span>
      <button
        type="button"
        aria-label="Dismiss announcement"
        className="ml-2 shrink-0 rounded-full p-0.5 hover:bg-brand-foreground/10"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, '1');
          setDismissed(true);
        }}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
