import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Briefcase,
  Clock,
  GraduationCap,
  HelpCircle,
  Instagram,
  Linkedin,
  LifeBuoy,
  MessageCircle,
  Twitter,
  Wrench,
  Youtube,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { ContactForm } from '@/features/support/components/contact-form';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with our team.',
};

const DEPARTMENTS = [
  {
    icon: MessageCircle,
    title: 'General Inquiries',
    description:
      'Questions about the platform, your account, or anything else - this is the right place to start.',
  },
  {
    icon: GraduationCap,
    title: 'Admissions & Courses',
    description: 'Questions about a specific course, curriculum, or which course fits your goals.',
  },
  {
    icon: Wrench,
    title: 'Technical Support',
    description:
      'Run into a bug, a broken page, or something not working as expected? Let us know the details.',
  },
  {
    icon: Briefcase,
    title: 'Partnerships & Sales',
    description:
      'Interested in bringing the academy to your team or organization? Tell us about your use case.',
  },
];

const SOCIAL_LINKS = [
  { icon: Linkedin, label: 'LinkedIn' },
  { icon: Twitter, label: 'X (Twitter)' },
  { icon: Youtube, label: 'YouTube' },
  { icon: Instagram, label: 'Instagram' },
];

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
      <PageHeader
        title="Contact us"
        description="Have a question? Send us a message and our team will get back to you."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {DEPARTMENTS.map((department) => (
          <Card key={department.title} className="flex flex-col gap-3 p-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
              <department.icon className="size-4.5" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">{department.title}</h3>
            <p className="text-sm text-muted-foreground">{department.description}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Send us a message</h2>
          <ContactForm />
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex items-start gap-3 p-5">
            <Clock className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Response times</h3>
              <p className="text-sm text-muted-foreground">
                Our team typically responds within one business day. Support is available around the
                clock through this form.
              </p>
            </div>
          </Card>
          <Card className="flex items-start gap-3 p-5">
            <HelpCircle className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Common questions</h3>
              <p className="text-sm text-muted-foreground">
                Check our{' '}
                <Link href={ROUTES.faq} className="text-brand underline-offset-4 hover:underline">
                  FAQ
                </Link>{' '}
                first - it may already have your answer.
              </p>
            </div>
          </Card>
          <Card className="flex items-start gap-3 p-5">
            <LifeBuoy className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Need more help?</h3>
              <p className="text-sm text-muted-foreground">
                Visit the{' '}
                <Link
                  href={ROUTES.helpCenter}
                  className="text-brand underline-offset-4 hover:underline"
                >
                  Help Center
                </Link>{' '}
                for guides and troubleshooting.
              </p>
            </div>
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <h3 className="text-sm font-semibold text-foreground">Follow along</h3>
            <p className="text-sm text-muted-foreground">
              We are a remote-first, globally distributed team - the fastest way to reach us is
              always this form.
            </p>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <span
                  key={social.label}
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground"
                >
                  <social.icon className="size-4" />
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
