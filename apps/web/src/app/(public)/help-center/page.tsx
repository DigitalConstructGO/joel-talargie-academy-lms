import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, GraduationCap, KeyRound, LifeBuoy, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Guides and answers to help you get the most out of the platform.',
};

const TOPICS = [
  {
    icon: KeyRound,
    title: 'Account & sign in',
    items: [
      'Creating an account',
      'Signing in with Google',
      'Resetting your password',
      'Verifying your email',
    ],
  },
  {
    icon: BookOpen,
    title: 'Courses',
    items: [
      'Browsing the catalog',
      'Enrolling in a course',
      'Free vs. paid courses',
      'Tracking your progress',
    ],
  },
  {
    icon: GraduationCap,
    title: 'Certificates',
    items: [
      'Which courses offer certificates',
      'How to earn a certificate',
      'Accessing your certificate',
    ],
  },
  {
    icon: LifeBuoy,
    title: 'Support',
    items: ['Contacting our team', 'Reporting an issue', 'Checking system status'],
  },
];

export default function HelpCenterPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
      <PageHeader
        title="Help center"
        description="Browse topics below, or check our FAQ and Contact pages for more."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TOPICS.map((topic) => (
          <Card key={topic.title} className="flex flex-col gap-3 p-6">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
              <topic.icon className="size-5" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">{topic.title}</h3>
            <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {topic.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 px-6 py-10 text-center">
        <h2 className="text-lg font-semibold text-foreground">Still need help?</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Check our full FAQ list or reach out to our team directly.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ROUTES.faq}
            className="flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            View FAQ
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href={ROUTES.contact}
            className="flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            Contact us
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
