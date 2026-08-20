import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
export type SettingCategory =
  | 'academy'
  | 'landing'
  | 'registration'
  | 'payment'
  | 'learning'
  | 'certificates'
  | 'notifications'
  | 'reports';
export interface SettingDefinition {
  key: string;
  category: SettingCategory;
  type: 'STRING' | 'BOOLEAN' | 'INTEGER' | 'EMAIL' | 'ENUM' | 'UUID' | 'JSON' | 'OBJECT' | 'ARRAY';
  defaultValue: unknown;
  permission: string;
  editable: boolean;
  restartRequired: boolean;
  description: string;
}
const defs: (Omit<
  SettingDefinition,
  'permission' | 'editable' | 'restartRequired' | 'description'
> &
  Partial<SettingDefinition>)[] = [
  {
    key: 'academy.name',
    category: 'academy',
    type: 'STRING',
    defaultValue: 'Joel Talargie Academy',
  },
  {
    key: 'academy.short_name',
    category: 'academy',
    type: 'STRING',
    defaultValue: 'JTA',
  },
  {
    key: 'academy.general',
    category: 'academy',
    type: 'OBJECT',
    defaultValue: {
      academyName: 'Joel Talargie Academy',
      shortDescription: 'Engineer Your Next Career Move',
      description:
        'Learn directly from the source. Elite industry experts meticulously designed our structured, self-paced curriculum.',
      contactEmail: 'contact@joeltalargie.com',
      contactPhone: '+251 900 000 000',
      website: 'https://joeltalargie.com',
      address: 'Addis Ababa, Ethiopia',
      socialLinks: {
        twitter: 'https://twitter.com',
        linkedin: 'https://linkedin.com',
        github: 'https://github.com',
        youtube: 'https://youtube.com',
        facebook: 'https://facebook.com',
      },
    },
  },
  {
    key: 'academy.branding',
    category: 'academy',
    type: 'OBJECT',
    defaultValue: {
      logoUrl: '/brand/logo.svg',
      faviconUrl: '/favicon.ico',
      primaryColor: '#1F4700',
      secondaryColor: '#C5A059',
      accentColor: '#10B981',
      heroBackgroundUrl: '/images/hero/network-abstract.jpg',
    },
  },
  {
    key: 'landing.sections',
    category: 'landing',
    type: 'OBJECT',
    defaultValue: {
      hero: true,
      valuePills: true,
      whyChooseUs: true,
      howItWorks: true,
      featuredCourses: true,
      categories: true,
      mentor: true,
      stats: true,
      pricing: true,
      testimonials: true,
      certificateVerify: true,
      faq: true,
      finalCta: true,
    },
  },
  {
    key: 'landing.hero',
    category: 'landing',
    type: 'OBJECT',
    defaultValue: {
      heading: 'Engineer Your Next Career Move.',
      description:
        'Learn directly from the source. Elite industry experts meticulously designed our structured, self-paced curriculum to deliver elite results with zero fluff. You are not just buying a course; you are investing in a masterclass.',
      primaryCtaText: 'Explore Courses',
      primaryCtaUrl: '/courses',
      secondaryCtaText: 'Create Account',
      secondaryCtaUrl: '/auth/register',
      heroImageUrl: '/images/hero/network-abstract.jpg',
      isActive: true,
    },
  },
  {
    key: 'landing.value_pills',
    category: 'landing',
    type: 'ARRAY',
    defaultValue: [
      {
        id: 'pill-1',
        title: 'Self-Paced Learning',
        description:
          'Study on your own schedule with lifetime access to every course you enroll in.',
        icon: 'Clock',
        displayOrder: 1,
        isActive: true,
      },
      {
        id: 'pill-2',
        title: 'Real Instructors',
        description:
          'Courses taught by working professionals, not narrators reading slides.',
        icon: 'Users',
        displayOrder: 2,
        isActive: true,
      },
      {
        id: 'pill-3',
        title: 'Verified Credentials',
        description:
          'Finish a certificate-eligible course and show what you learned to employers.',
        icon: 'Award',
        displayOrder: 3,
        isActive: true,
      },
    ],
  },
  {
    key: 'landing.why_choose_us',
    category: 'landing',
    type: 'ARRAY',
    defaultValue: [
      {
        id: 'why-1',
        title: 'Learn at your own pace',
        description:
          'Courses are self-paced with full lifetime access, so you can learn on your schedule.',
        icon: 'Clock',
        displayOrder: 1,
        isActive: true,
      },
      {
        id: 'why-2',
        title: 'Earn certificates',
        description:
          'Complete eligible courses to earn a certificate of completion you can share.',
        icon: 'Award',
        displayOrder: 2,
        isActive: true,
      },
      {
        id: 'why-3',
        title: 'Vetted instructors',
        description:
          'Every course is reviewed before publishing to keep quality high.',
        icon: 'ShieldCheck',
        displayOrder: 3,
        isActive: true,
      },
      {
        id: 'why-4',
        title: 'Learn anywhere',
        description:
          'A fully responsive experience across desktop, tablet, and mobile.',
        icon: 'Smartphone',
        displayOrder: 4,
        isActive: true,
      },
    ],
  },
  {
    key: 'landing.how_it_works',
    category: 'landing',
    type: 'ARRAY',
    defaultValue: [
      {
        id: 'step-1',
        stepNumber: '01',
        title: 'Create an account',
        description: 'Sign up free in under a minute.',
        icon: 'UserPlus',
        displayOrder: 1,
        isActive: true,
      },
      {
        id: 'step-2',
        stepNumber: '02',
        title: 'Find a course',
        description: 'Browse the catalog or search for a topic.',
        icon: 'Search',
        displayOrder: 2,
        isActive: true,
      },
      {
        id: 'step-3',
        stepNumber: '03',
        title: 'Start learning',
        description: 'Work through lessons at your own pace.',
        icon: 'PlayCircle',
        displayOrder: 3,
        isActive: true,
      },
      {
        id: 'step-4',
        stepNumber: '04',
        title: 'Get certified',
        description: 'Finish the course and earn your certificate.',
        icon: 'Award',
        displayOrder: 4,
        isActive: true,
      },
    ],
  },
  {
    key: 'landing.featured_courses',
    category: 'landing',
    type: 'OBJECT',
    defaultValue: {
      enabled: true,
      limit: 8,
    },
  },
  {
    key: 'landing.categories',
    category: 'landing',
    type: 'OBJECT',
    defaultValue: {
      enabled: true,
      limit: 8,
      ordering: 'courseCount',
    },
  },
  {
    key: 'landing.mentor',
    category: 'landing',
    type: 'OBJECT',
    defaultValue: {
      enabled: true,
      featuredInstructorId: null,
      name: '',
      headline: '',
      bio: '',
      photoUrl: '',
      achievements: [],
    },
  },
  {
    key: 'landing.statistics',
    category: 'landing',
    type: 'OBJECT',
    defaultValue: {
      enabled: true,
      items: [
        {
          key: 'students',
          label: 'Students enrolled',
          displayOrder: 1,
          isEnabled: true,
        },
        {
          key: 'courses',
          label: 'Active courses',
          displayOrder: 2,
          isEnabled: true,
        },
        {
          key: 'rating',
          label: 'Average course rating',
          displayOrder: 3,
          isEnabled: true,
        },
        {
          key: 'satisfaction',
          label: 'Student satisfaction',
          displayOrder: 4,
          isEnabled: true,
        },
      ],
    },
  },
  {
    key: 'landing.testimonials',
    category: 'landing',
    type: 'ARRAY',
    defaultValue: [
      {
        id: 'test-1',
        studentName: 'Abebe Kebede',
        avatarUrl: '',
        testimonial:
          'The curriculum was straightforward and practical. I was able to apply what I learned in my engineering job within weeks.',
        rating: 5,
        courseTitle: 'Full-Stack Web Development',
        isFeatured: true,
        displayOrder: 1,
        isActive: true,
      },
      {
        id: 'test-2',
        studentName: 'Sara Mohammed',
        avatarUrl: '',
        testimonial:
          'Exceptional instruction and crystal-clear explanations. The certificate verification was seamless.',
        rating: 5,
        courseTitle: 'Advanced Cloud Architecture',
        isFeatured: true,
        displayOrder: 2,
        isActive: true,
      },
      {
        id: 'test-3',
        studentName: 'Dawit Yohannes',
        avatarUrl: '',
        testimonial:
          'By far the best learning experience I have had online. Hands-on exercises and great support.',
        rating: 5,
        courseTitle: 'System Design & DevOps',
        isFeatured: true,
        displayOrder: 3,
        isActive: true,
      },
    ],
  },
  {
    key: 'landing.faqs',
    category: 'landing',
    type: 'ARRAY',
    defaultValue: [
      {
        id: 'faq-1',
        question: 'Are the courses self-paced?',
        answer:
          'Yes, all courses offer lifetime access so you can study at your own pace whenever and wherever you want.',
        category: 'General',
        displayOrder: 1,
        isActive: true,
      },
      {
        id: 'faq-2',
        question: 'Do I get a certificate upon completion?',
        answer:
          'Yes, once you complete all required lessons and assessments in a course, you receive a verified digital certificate with QR authentication.',
        category: 'Certificates',
        displayOrder: 2,
        isActive: true,
      },
      {
        id: 'faq-3',
        question: 'What payment methods are supported?',
        answer:
          'We support multiple payment methods including mobile money, bank transfers, and standard credit/debit cards.',
        category: 'Payments',
        displayOrder: 3,
        isActive: true,
      },
      {
        id: 'faq-4',
        question: 'Can I access the platform on mobile devices?',
        answer:
          'Absolutely. The academy is completely responsive and works smoothly on smartphones, tablets, laptops, and desktop computers.',
        category: 'General',
        displayOrder: 4,
        isActive: true,
      },
    ],
  },
  {
    key: 'landing.final_cta',
    category: 'landing',
    type: 'OBJECT',
    defaultValue: {
      heading: 'Ready to Start?',
      description:
        'Join for free and get access to our full course catalog today - no credit card required.',
      ctaText: 'Start Learning Today',
      ctaUrl: '/auth/register',
      isActive: true,
    },
  },
  {
    key: 'academy.support_email',
    category: 'academy',
    type: 'EMAIL',
    defaultValue: 'support@example.com',
  },
  {
    key: 'academy.support_phone',
    category: 'academy',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'academy.timezone',
    category: 'academy',
    type: 'STRING',
    defaultValue: 'Africa/Addis_Ababa',
  },
  {
    key: 'academy.default_locale',
    category: 'academy',
    type: 'STRING',
    defaultValue: 'en',
  },
  {
    key: 'academy.default_currency',
    category: 'academy',
    type: 'ENUM',
    defaultValue: 'ETB',
  },
  {
    key: 'registration.enabled',
    category: 'registration',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'registration.require_email_verification',
    category: 'registration',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'registration.allow_google_auth',
    category: 'registration',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'registration.default_student_role_code',
    category: 'registration',
    type: 'STRING',
    defaultValue: 'STUDENT',
  },
  {
    key: 'payment.manual.enabled',
    category: 'payment',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'payment.bank_name',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'payment.account_name',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'payment.account_number',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'payment.branch',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'payment.reference_instructions',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'payment.general_instructions',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'payment.default_currency',
    category: 'payment',
    type: 'ENUM',
    defaultValue: 'ETB',
  },
  {
    key: 'payment.receipt_max_size_mb',
    category: 'payment',
    type: 'INTEGER',
    defaultValue: 10,
  },
  {
    key: 'payment.support_contact',
    category: 'payment',
    type: 'STRING',
    defaultValue: '',
  },
  {
    key: 'learning.completed_review_access_enabled',
    category: 'learning',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'learning.video_position_update_interval_seconds',
    category: 'learning',
    type: 'INTEGER',
    defaultValue: 15,
  },
  {
    key: 'learning.require_published_mandatory_lesson',
    category: 'learning',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'certificates.generation_enabled',
    category: 'certificates',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'certificates.default_template_id',
    category: 'certificates',
    type: 'UUID',
    defaultValue: null,
  },
  {
    key: 'certificates.student_download_revoked_enabled',
    category: 'certificates',
    type: 'BOOLEAN',
    defaultValue: false,
  },
  {
    key: 'certificates.public_verification_enabled',
    category: 'certificates',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'notifications.email_enabled',
    category: 'notifications',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'notifications.in_app_enabled',
    category: 'notifications',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'notifications.default_learning_email',
    category: 'notifications',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'notifications.default_payment_email',
    category: 'notifications',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'notifications.default_certificate_email',
    category: 'notifications',
    type: 'BOOLEAN',
    defaultValue: true,
  },
  {
    key: 'reports.default_timezone',
    category: 'reports',
    type: 'STRING',
    defaultValue: 'Africa/Addis_Ababa',
  },
  {
    key: 'reports.default_page_size',
    category: 'reports',
    type: 'INTEGER',
    defaultValue: 25,
  },
  {
    key: 'reports.maximum_export_rows',
    category: 'reports',
    type: 'INTEGER',
    defaultValue: 100000,
  },
  {
    key: 'reports.export_retention_days',
    category: 'reports',
    type: 'INTEGER',
    defaultValue: 30,
  },
];
@Injectable()
export class SettingRegistryService {
  readonly definitions: SettingDefinition[] = defs.map((d) => ({
    ...d,
    permission: d.permission ?? `settings.update_${d.category}`,
    editable: d.editable ?? true,
    restartRequired: d.restartRequired ?? false,
    description: d.description ?? d.key.replace(/[._]/g, ' '),
  }));
  get(key: string) {
    const d = this.definitions.find((x) => x.key === key);
    if (!d) throw new BadRequestException('Unknown platform setting');
    return d;
  }
  validate(d: SettingDefinition, value: unknown) {
    if (d.type === 'BOOLEAN' && typeof value !== 'boolean')
      throw new BadRequestException('Expected boolean');
    if (
      d.type === 'INTEGER' &&
      (!Number.isInteger(value) || Number(value) <= 0)
    )
      throw new BadRequestException('Expected positive integer');
    if (d.type === 'OBJECT' && (typeof value !== 'object' || value === null || Array.isArray(value)))
      throw new BadRequestException('Expected object');
    if (d.type === 'ARRAY' && !Array.isArray(value))
      throw new BadRequestException('Expected array');
    if (
      ['STRING', 'EMAIL', 'ENUM'].includes(d.type) &&
      typeof value !== 'string'
    )
      throw new BadRequestException('Expected string');
    if (
      typeof value === 'string' &&
      (value.includes('\r') || value.includes('\n') || value.length > 2000)
    )
      throw new BadRequestException('Unsafe setting value');
    if (d.type === 'EMAIL' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value)))
      throw new BadRequestException('Invalid email');
    if (d.key.includes('currency') && !/^[A-Z]{3}$/.test(String(value)))
      throw new BadRequestException('Invalid currency');
    if (d.key.includes('timezone')) {
      try {
        Intl.DateTimeFormat('en', { timeZone: String(value) });
      } catch {
        throw new BadRequestException('Invalid IANA timezone');
      }
    }
    if (
      d.key === 'registration.default_student_role_code' &&
      String(value).toUpperCase().includes('ADMIN')
    )
      throw new BadRequestException(
        'Administrator cannot be the default Student role',
      );
    if (
      d.key === 'reports.maximum_export_rows' &&
      Number(value) > Number(process.env.REPORT_EXPORT_MAX_ROWS ?? 100000)
    )
      throw new BadRequestException('Environment report-row limit exceeded');
    if (
      d.key === 'payment.receipt_max_size_mb' &&
      Number(value) > Number(process.env.PAYMENT_RECEIPT_MAX_SIZE_MB ?? 10)
    )
      throw new BadRequestException('Environment upload limit exceeded');
    if (
      d.key === 'notifications.email_enabled' &&
      value === true &&
      process.env.MAIL_ENABLED !== 'true'
    )
      throw new BadRequestException(
        'Mail is disabled by deployment configuration',
      );
    if (
      d.key === 'certificates.generation_enabled' &&
      value === true &&
      process.env.CERTIFICATE_GENERATION_ENABLED === 'false'
    )
      throw new BadRequestException(
        'Certificate generation is disabled by deployment configuration',
      );
  }
  authorize(d: SettingDefinition, permissions: string[], admin = false) {
    if (
      !admin &&
      !permissions.includes('settings.update') &&
      !permissions.includes(d.permission as any)
    )
      throw new ForbiddenException('Setting-specific permission required');
  }
}
