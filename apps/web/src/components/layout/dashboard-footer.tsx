'use client';

import Link from 'next/link';
import { Globe, Share2 } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site.config';
import { NewsletterForm } from '@/components/common/newsletter-form';

const RESOURCE_LINKS = [
  { label: 'Browse Categories', href: ROUTES.categories.list },
  { label: 'Become an Instructor', href: ROUTES.contact },
  { label: 'Contact Support', href: ROUTES.dashboard.support },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: ROUTES.privacyPolicy },
  { label: 'Terms of Service', href: ROUTES.terms },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground transition-colors hover:text-brand-gradient-from"
    >
      {label}
    </Link>
  );
}

/** Persistent footer for the authenticated dashboard shell - brand blurb, resource/legal links, and a newsletter signup, in the same dark-navy sidebar palette. */
export function DashboardFooter() {
  return (
    <footer className="w-full shrink-0 bg-sidebar px-4 py-12 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 md:grid-cols-4">
        <div>
          <h2 className="mb-4 text-xl font-bold text-white">{siteConfig.name}</h2>
          <p className="pr-4 text-sm text-muted-foreground">{siteConfig.description}</p>
        </div>
        <div>
          <h4 className="mb-4 font-bold text-white">Resources</h4>
          <ul className="flex flex-col gap-3">
            {RESOURCE_LINKS.map((link) => (
              <li key={link.label}>
                <FooterLink {...link} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-bold text-white">Legal</h4>
          <ul className="flex flex-col gap-3">
            {LEGAL_LINKS.map((link) => (
              <li key={link.label}>
                <FooterLink {...link} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-bold text-white">Join Newsletter</h4>
          <NewsletterForm />
        </div>
      </div>
      <div className="mx-auto mt-8 flex w-full max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <div className="flex gap-6">
          <a
            href="#"
            aria-label="Website"
            className="text-muted-foreground transition-colors hover:text-white"
          >
            <Globe className="size-5" />
          </a>
          <a
            href="#"
            aria-label="Share"
            className="text-muted-foreground transition-colors hover:text-white"
          >
            <Share2 className="size-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
