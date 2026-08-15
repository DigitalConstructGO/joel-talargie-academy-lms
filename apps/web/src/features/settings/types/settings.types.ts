export type SettingCategory =
  | 'academy'
  | 'landing'
  | 'registration'
  | 'payment'
  | 'learning'
  | 'certificates'
  | 'notifications'
  | 'reports';

export type SettingType =
  | 'STRING'
  | 'BOOLEAN'
  | 'INTEGER'
  | 'EMAIL'
  | 'ENUM'
  | 'UUID'
  | 'JSON'
  | 'OBJECT'
  | 'ARRAY';

export interface PlatformSetting {
  key: string;
  category: SettingCategory;
  type: SettingType;
  defaultValue: unknown;
  permission: string;
  editable: boolean;
  restartRequired: boolean;
  description: string;
  value: unknown;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface SettingsListParams {
  category?: SettingCategory;
  search?: string;
}

export interface UpdateSettingInput {
  value: unknown;
  reason: string;
}

export interface UpdateSettingsBatchInput {
  reason: string;
  items: { key: string; value: unknown }[];
}

export interface SettingHistoryEntry {
  id: string;
  previousValue: unknown;
  newValue: unknown;
  reason: string;
  actorId: string;
  createdAt: string;
}

export interface AcademyGeneralSettings {
  academyName: string;
  shortDescription: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
    facebook?: string;
  };
}

export interface AcademyBrandingSettings {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  heroBackgroundUrl: string;
}

export interface LandingSectionsSettings {
  hero: boolean;
  valuePills: boolean;
  whyChooseUs: boolean;
  howItWorks: boolean;
  featuredCourses: boolean;
  categories: boolean;
  mentor: boolean;
  stats: boolean;
  pricing: boolean;
  testimonials: boolean;
  certificateVerify: boolean;
  faq: boolean;
  finalCta: boolean;
}

export interface HeroSettings {
  heading: string;
  description: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  heroImageUrl: string;
  isActive: boolean;
}

export interface ValuePillItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

export interface WhyChooseUsItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

export interface HowItWorksItem {
  id: string;
  stepNumber: string;
  title: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

export interface FeaturedCoursesSettings {
  enabled: boolean;
  limit: number;
}

export interface CategoriesSettings {
  enabled: boolean;
  limit: number;
  ordering: string;
}

export interface MentorSettings {
  enabled: boolean;
  featuredInstructorId: string | null;
}

export interface PlatformStatsSettings {
  enabled: boolean;
  items: Array<{
    key: string;
    label: string;
    displayOrder: number;
    isEnabled: boolean;
  }>;
}

export interface TestimonialItem {
  id: string;
  studentName: string;
  avatarUrl: string;
  testimonial: string;
  rating: number;
  courseTitle: string;
  isFeatured: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
}

export interface FinalCtaSettings {
  heading: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  isActive: boolean;
}

export interface PublicSettings {
  academyName: string;
  shortName: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;
  timezone: string;
  registrationEnabled: boolean;
}

export interface StructuredAcademySettings {
  general: AcademyGeneralSettings;
  branding: AcademyBrandingSettings;
  sections: LandingSectionsSettings;
  hero: HeroSettings;
  valuePills: ValuePillItem[];
  whyChooseUs: WhyChooseUsItem[];
  howItWorks: HowItWorksItem[];
  featuredCourses: FeaturedCoursesSettings;
  categories: CategoriesSettings;
  mentor: MentorSettings;
  statistics: PlatformStatsSettings;
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  finalCta: FinalCtaSettings;
  publicSettings: PublicSettings;
}

export interface PublicLandingData {
  general: AcademyGeneralSettings;
  branding: AcademyBrandingSettings;
  sections: Record<string, boolean>;
  hero: HeroSettings;
  valuePills: ValuePillItem[];
  whyChooseUs: WhyChooseUsItem[];
  howItWorks: HowItWorksItem[];
  featuredCourses: Array<{
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    thumbnailUrl: string | null;
    price: number;
    currency: string;
    accessType: 'FREE' | 'PAID';
    difficulty: string;
    ratingAverage: number;
    ratingCount: number;
    enrollmentCount: number;
    durationMinutes: number;
    isFeatured: boolean;
    category?: { id: string; name: string; slug: string };
    instructor: { name: string };
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string | null;
    courseCount: number;
  }>;
  mentor: {
    id: string;
    name: string;
    headline: string;
    bio: string;
    avatarUrl: string | null;
  };
  statistics: {
    studentsEnrolled: number;
    totalCourses: number;
    totalEnrollments: number;
    averageRating: number;
    satisfactionPercent: number;
  };
  statsConfig?: PlatformStatsSettings;
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  finalCta: FinalCtaSettings;
}

export const SETTING_CATEGORY_LABELS: Record<SettingCategory, string> = {
  academy: 'Academy Information',
  landing: 'Landing Page CMS',
  registration: 'Registration',
  payment: 'Payment',
  learning: 'Learning',
  certificates: 'Certificates',
  notifications: 'Notifications',
  reports: 'Reports',
};
