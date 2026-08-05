import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';
import { NewsletterForm } from '@/components/common/newsletter-form';

const FOOTER_SECTIONS = [
  {
    title: 'Platform',
    links: [
      { label: 'Courses', href: ROUTES.courses.list },
      { label: 'Categories', href: ROUTES.categories.list },
      { label: 'Instructors', href: ROUTES.instructors.list },
      { label: 'Pricing', href: ROUTES.pricing },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: ROUTES.about },
      { label: 'Contact', href: ROUTES.contact },
      { label: 'FAQ', href: ROUTES.faq },
      { label: 'Help center', href: ROUTES.helpCenter },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', href: ROUTES.privacyPolicy },
      { label: 'Terms of service', href: ROUTES.terms },
      { label: 'Cookie policy', href: ROUTES.cookiePolicy },
      { label: 'System status', href: ROUTES.health },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <GraduationCap className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">{siteConfig.name}</span>
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">{siteConfig.description}</p>
          <div className="mt-2">
            <p className="mb-2 text-sm font-medium text-foreground">Get course updates</p>
            <NewsletterForm className="max-w-sm" />
          </div>
        </div>

        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
            <ul className="flex flex-col gap-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
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
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
