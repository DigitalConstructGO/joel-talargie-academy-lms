import type { Metadata } from 'next';
import { LegalPage } from '@/components/common/legal-page';
import { siteConfig } from '@/config/site.config';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms and conditions for using ${siteConfig.name}.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updatedAt="August 5, 2026"
      intro={`These Terms of Service govern your use of ${siteConfig.name}. By creating an account or using the platform, you agree to these terms.`}
      sections={[
        {
          heading: 'Using the platform',
          body: [
            'You must provide accurate information when creating an account and are responsible for keeping your login credentials secure.',
            'You agree to use the platform only for lawful purposes and not to interfere with its operation or other users.',
          ],
        },
        {
          heading: 'Courses and content',
          body: [
            'Course content is provided by instructors and is intended for your personal, non-commercial learning use. You may not redistribute or resell course content.',
            'Free and paid courses are clearly labeled. Paid courses grant lifetime access once enrolled, subject to these terms.',
          ],
        },
        {
          heading: 'Certificates',
          body: [
            'Certificates of completion, where offered, indicate that you completed the mandatory lessons of a course. They do not constitute a formal academic credential unless explicitly stated.',
          ],
        },
        {
          heading: 'Account termination',
          body: [
            'We may suspend or terminate accounts that violate these terms. You may close your account at any time by contacting us.',
          ],
        },
        {
          heading: 'Changes to these terms',
          body: [
            'We may update these terms from time to time. Continued use of the platform means you accept the updated terms.',
          ],
        },
        {
          heading: 'Contact us',
          body: ['Questions about these terms can be sent through our Contact page.'],
        },
      ]}
    />
  );
}
