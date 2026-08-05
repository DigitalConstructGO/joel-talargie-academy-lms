import type { Metadata } from 'next';
import { LegalPage } from '@/components/common/legal-page';
import { siteConfig } from '@/config/site.config';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updatedAt="August 5, 2026"
      intro={`This Privacy Policy explains how ${siteConfig.name} collects, uses, and protects your information when you use our platform.`}
      sections={[
        {
          heading: 'Information we collect',
          body: [
            'When you create an account, we collect information such as your name, email address, and password. When you sign in with Google, we receive your name, email address, and profile picture from your Google account.',
            'We also collect information about your activity on the platform, such as course enrollments and progress, to provide our services to you.',
          ],
        },
        {
          heading: 'How we use your information',
          body: [
            'We use your information to provide and improve the platform, communicate with you about your account and courses, and maintain the security of our services.',
          ],
        },
        {
          heading: 'Cookies',
          body: [
            'We use cookies to keep you signed in and remember your preferences. See our Cookie Policy for details.',
          ],
        },
        {
          heading: 'Data sharing',
          body: [
            'We do not sell your personal information. We only share information with service providers as needed to operate the platform, or as required by law.',
          ],
        },
        {
          heading: 'Your rights',
          body: [
            'You can access, update, or delete your account information at any time from your account settings. Contact us if you need further assistance.',
          ],
        },
        {
          heading: 'Contact us',
          body: [
            'If you have questions about this Privacy Policy, please reach out through our Contact page.',
          ],
        },
      ]}
    />
  );
}
