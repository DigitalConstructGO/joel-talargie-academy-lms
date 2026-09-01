'use client';

import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';

export function VerifyCertificatePageHeader() {
  const { t, locale } = useLanguage();
  return (
    <div className="text-center space-y-2">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
        <ShieldCheck className="size-3.5" />
        {locale === 'am' ? 'ኦፊሴላዊ ሰርተፊኬት ማረጋገጫ' : 'Official Credential Verification'}
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {t('nav.verifyCertificate')}
      </h1>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">{t('categories.subtitle')}</p>
    </div>
  );
}
