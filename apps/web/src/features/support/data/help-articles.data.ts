import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CreditCard,
  KeyRound,
  LifeBuoy,
  ShieldCheck,
  UserCog,
} from 'lucide-react';

export interface HelpArticle {
  question: string;
  answer: string;
}

export interface HelpCategory {
  icon: LucideIcon;
  title: string;
  articles: HelpArticle[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    articles: [
      {
        question: 'Creating your account',
        answer:
          'Sign up with your email and password, or use Google sign-in for a faster setup. You can start browsing the catalog immediately, even before verifying your email.',
      },
      {
        question: 'Finding your first course',
        answer:
          'Use the search bar or browse by category from the Courses page. Each course page shows the full curriculum, requirements, and what you will learn before you enroll.',
      },
      {
        question: 'Understanding free vs. paid courses',
        answer:
          'Every course is individually priced by its instructor. Free courses grant instant access; paid courses walk you through checkout before you can start learning.',
      },
    ],
  },
  {
    icon: UserCog,
    title: 'Account Management',
    articles: [
      {
        question: 'Updating your profile',
        answer:
          'You can update your name and profile details from your dashboard settings at any time.',
      },
      {
        question: 'Changing your password',
        answer:
          'Update your password from your account settings, or use the "Forgot password" flow from the sign-in page if you are locked out.',
      },
      {
        question: 'Closing your account',
        answer:
          'Contact our support team through the Contact page if you would like your account closed, and we will guide you through the process.',
      },
    ],
  },
  {
    icon: KeyRound,
    title: 'Authentication',
    articles: [
      {
        question: 'Signing in with Google',
        answer:
          'You can create an account or sign in using Google in one click, without setting a separate password for the platform.',
      },
      {
        question: 'Verifying your email',
        answer:
          'After registering, check your inbox for a verification link. Verifying your email secures your account and unlocks certain account actions.',
      },
      {
        question: 'Resetting a forgotten password',
        answer:
          'Use the "Forgot password" link on the sign-in page. You will receive a secure reset link by email that expires after a short period for your security.',
      },
    ],
  },
  {
    icon: BookOpen,
    title: 'Courses',
    articles: [
      {
        question: 'How enrollment works',
        answer:
          'Open any course page and select enroll. Free courses grant immediate access; paid courses take you through checkout first.',
      },
      {
        question: 'Tracking your progress',
        answer:
          'Your progress is calculated from the mandatory lessons you complete in a course. Completed lessons are always saved - you will never lose progress by leaving and coming back later.',
      },
      {
        question: 'Course content updates',
        answer:
          'Instructors occasionally update lessons to keep content current. Updates to a published course are reflected automatically for everyone already enrolled.',
      },
    ],
  },
  {
    icon: CreditCard,
    title: 'Payments',
    articles: [
      {
        question: 'How checkout works',
        answer:
          'When you enroll in a paid course, you will see the price, any active discount, and payment instructions before you confirm.',
      },
      {
        question: 'Using a promo code',
        answer:
          'If a course has an active promotion, enter your code at checkout to see the discounted price applied before you complete enrollment.',
      },
      {
        question: 'Requesting a refund',
        answer:
          'Refund requests are reviewed by our support team on a case-by-case basis. Reach out through the Contact page with your enrollment details.',
      },
    ],
  },
  {
    icon: Award,
    title: 'Certificates',
    articles: [
      {
        question: 'Which courses offer certificates',
        answer:
          'Courses that offer a certificate of completion are clearly marked on their course page before you enroll.',
      },
      {
        question: 'Earning your certificate',
        answer:
          'Completing every mandatory lesson in a certificate-enabled course triggers your certificate of completion automatically.',
      },
      {
        question: 'Accessing your certificate',
        answer:
          'Once earned, your certificates are available from your student dashboard alongside the course you completed.',
      },
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Security',
    articles: [
      {
        question: 'How your data is protected',
        answer:
          'We use industry-standard practices to protect your account, including secure password storage and encrypted connections throughout the platform.',
      },
      {
        question: 'Recognizing phishing attempts',
        answer:
          'We will never ask for your password by email. If you receive a suspicious message claiming to be from us, report it through the Contact page.',
      },
      {
        question: 'Keeping your account secure',
        answer:
          'Use a strong, unique password and keep your email account secure, since it is used for password resets and account verification.',
      },
    ],
  },
  {
    icon: BookOpen,
    title: 'Learning Experience',
    articles: [
      {
        question: 'Learning at your own pace',
        answer:
          'Every course is self-paced. There are no deadlines - progress is saved automatically so you can pause and resume whenever you like.',
      },
      {
        question: 'Using the wishlist',
        answer:
          'Save courses you are interested in to your wishlist so you can find them again later without searching the catalog from scratch.',
      },
      {
        question: 'Accessing course resources',
        answer:
          'Where an instructor has attached downloadable resources to a lesson, you can access them directly from that lesson.',
      },
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Troubleshooting',
    articles: [
      {
        question: 'A lesson video will not play',
        answer:
          'Try refreshing the page or switching browsers first. If the issue continues, let us know through the Contact page with the course and lesson name.',
      },
      {
        question: "I can't sign in to my account",
        answer:
          'Double check your email and password, or use "Forgot password" to reset it. If you signed up with Google, use the Google sign-in button instead.',
      },
      {
        question: 'My progress does not look right',
        answer:
          'Completed lessons are never marked incomplete again, so this is usually a display refresh issue. Reload your dashboard, and contact support if the problem persists.',
      },
    ],
  },
  {
    icon: LifeBuoy,
    title: 'Support',
    articles: [
      {
        question: 'Contacting our team',
        answer:
          'Use the Contact page for any question we have not answered here - our team responds to every message.',
      },
      {
        question: 'Checking system status',
        answer:
          'You can check the current platform status from the System status link in the site footer.',
      },
      {
        question: 'Reporting a bug',
        answer:
          'Found something broken? Let us know through the Contact page with as much detail as possible - the page you were on and what you expected to happen.',
      },
    ],
  },
];
