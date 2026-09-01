'use client';

import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, type SupportedLocale } from '@/lib/i18n/language-provider';

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2 text-xs font-medium hover:bg-accent focus-visible:ring-0"
          aria-label={t('lang.title')}
        >
          <Globe className="size-4 text-muted-foreground" />
          <span className="font-semibold uppercase tracking-wider">
            {locale === 'am' ? t('lang.amShort') : t('lang.enShort')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => setLocale('en')}
          className="flex items-center justify-between cursor-pointer text-xs font-medium"
        >
          <span>{t('lang.english')}</span>
          {locale === 'en' && <span className="text-brand font-bold">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('am')}
          className="flex items-center justify-between cursor-pointer text-xs font-medium"
        >
          <span>{t('lang.amharic')}</span>
          {locale === 'am' && <span className="text-brand font-bold">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
