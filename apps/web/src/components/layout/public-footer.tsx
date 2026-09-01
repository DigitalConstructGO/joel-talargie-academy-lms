'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';
import { NewsletterForm } from '@/components/common/newsletter-form';

import { useLanguage } from '@/lib/i18n/language-provider';
import type { TranslationKey } from '@/lib/i18n/translations/en';

const FOOTER_SECTIONS: {
  titleKey: TranslationKey;
  links: { labelKey: TranslationKey; href: string }[];
}[] = [
  {
    titleKey: 'footer.platform',
    links: [
      { labelKey: 'nav.courses', href: ROUTES.courses.list },
      { labelKey: 'nav.categories', href: ROUTES.categories.list },
      { labelKey: 'nav.instructors', href: ROUTES.instructors.list },
      { labelKey: 'nav.pricing', href: ROUTES.pricing },
      { labelKey: 'nav.verifyCertificate', href: ROUTES.certificates.verifyLookup },
    ],
  },
  {
    titleKey: 'footer.company',
    links: [
      { labelKey: 'nav.about', href: ROUTES.about },
      { labelKey: 'nav.contact', href: ROUTES.contact },
    ],
  },
];

export function PublicFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <GraduationCap className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">{siteConfig.name}</span>
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">{siteConfig.description}</p>
          <div className="mt-2">
            <p className="mb-2 text-sm font-medium text-foreground">{t('footer.updates')}</p>
            <NewsletterForm className="max-w-sm" />
          </div>
        </div>

        {FOOTER_SECTIONS.map((section) => (
          <div key={section.titleKey} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">{t(section.titleKey)}</h3>
            <ul className="flex flex-col gap-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}. {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}
