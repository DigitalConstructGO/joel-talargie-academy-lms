'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { en, type TranslationKey } from './translations/en';
import { am } from './translations/am';

export type SupportedLocale = 'en' | 'am';

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: TranslationKey) => string;
}

const STORAGE_KEY = 'joel_academy_locale';

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key: TranslationKey) => en[key] || key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
    if (saved === 'en' || saved === 'am') {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  };

  const t = (key: TranslationKey): string => {
    const dictionary = locale === 'am' ? am : en;
    return dictionary[key] || en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale: isMounted ? locale : 'en', setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

const CATEGORY_MAP_AM: Record<string, string> = {
  'Artificial Intelligence': 'አርቲፊሻል ኢንተለጀንስ',
  Programmings: 'ፕሮግራሚንግ',
  Programming: 'ፕሮግራሚንግ',
  Business: 'ቢዝነስ',
  Marketing: 'ማርኬቲንግ',
  Design: 'ዲዛይን',
  'Data Science': 'ዳታ ሳይንስ',
  'DevOps & Cloud': 'ደመና እና ዴቭኦፕስ',
  Cybersecurity: 'ሳይበር ሴኪዩሪቲ',
  'Mobile Development': 'ሞባይል ልማት',
  'Web Development': 'ዌብ ልማት',
};

const COURSE_TITLE_MAP_AM: Record<string, string> = {
  'Online Freelancing & High-Income Remote Work with AI': 'በኤአይ የመስመር ላይ ፍሪላንሲንግ እና የርቀት ስራ',
  'AI & Modern Technology: Orientation & Roadmap': 'ኤአይ እና ዘመናዊ ቴክኖሎጂ፡ መግቢያ እና መንገድ',
  'AI-Driven Digital Marketing & Content Creation Engine': 'በኤአይ የሚመራ ዲጂታል ማርኬቲንግ እና የይዘት ፈጠራ',
  'Full-Stack Web Development BootCamp': 'ሙሉ-ስታክ ዌብ ልማት ቡትካምፕ',
  'Python Data Science & Machine Learning': 'ፓይተን ዳታ ሳይንስ እና ማሽን ለርኒንግ',
  'Cloud Architecture & AWS Certification': 'ክላውድ አርክቴክቸር እና ኤደብሊውኤስ ሰርተፊኬሽን',
  'UI/UX Design Masterclass': 'ዩአይ/ዩኤክስ ዲዛይን ማስተርክላስ',
  'Cybersecurity & Ethical Hacking': 'ሳይበር ሴኪዩሪቲ እና ኢቲካል ሃኪንግ',
  'Digital Marketing & Social Media Strategy': 'ዲጂታል ማርኬቲንግ እና ሶሻል ሚዲያ',
  'Financial Analysis & Business Valuation': 'ፋይናንሺያል አናሊሲስ እና ቢዝነስ ቫልዩኤሽን',
  'Mobile App Development with Flutter & Dart': 'ሞባይል አፕ ልማት በፍላተር እና ዳርት',
};

export function translateCategoryName(name: string, locale: SupportedLocale): string {
  if (locale === 'am') {
    return CATEGORY_MAP_AM[name] || name;
  }
  return name;
}

const MODULE_MAP_AM: Record<string, string> = {
  audit: 'ኦዲት',
  categories: 'ምድቦች',
  certificates: 'ሰርተፊኬቶች',
  courses: 'ኮርሶች',
  dashboard: 'ዳሽቦርድ',
  enrollments: 'ምዝገባዎች',
  learning: 'ትምህርት',
  lessons: 'ትምህርቶች',
  notifications: 'ማስታወቂያዎች',
  payment_methods: 'የክፍያ መንገዶች',
  payments: 'ክፍያዎች',
  permissions: 'ፈቃዶች',
  promotions: 'ማስተዋወቂያዎች',
  reports: 'ሪፖርቶች',
  roles: 'ሚናዎች',
  sections: 'ክፍሎች',
  settings: 'መቼቶች',
  users: 'ተጠቃሚዎች',
};

export function translateModuleName(module: string, locale: SupportedLocale): string {
  if (locale === 'am') {
    return MODULE_MAP_AM[module.toLowerCase()] || module;
  }
  return module;
}

export function translateCourseTitle(title: string, locale: SupportedLocale): string {
  if (locale === 'am') {
    return COURSE_TITLE_MAP_AM[title] || title;
  }
  return title;
}

const NOTIFICATION_TITLE_MAP_AM: Record<string, string> = {
  'Payment approved': 'ክፍያ ተፈቅዷል',
  'Payment submitted': 'ክፍያ ቀርቧል',
  'Payment required': 'ክፍያ ያስፈልጋል',
  'New Google sign-in': 'አዲስ በGoogle መግባት',
  'Enrollment confirmed': 'ምዝገባ ተረጋገጠ',
};

export function translateNotificationTitle(title: string, locale: SupportedLocale): string {
  if (locale === 'am') {
    return NOTIFICATION_TITLE_MAP_AM[title] || title;
  }
  return title;
}

const ROLE_MAP_AM: Record<string, string> = {
  Administrator: 'አስተዳዳሪ',
  'Content Manager': 'የይዘት አስተዳዳሪ',
  Instructor: 'አስተማሪ',
  Student: 'ተማሪ',
};

export function translateRoleName(name: string, locale: SupportedLocale): string {
  if (locale === 'am') {
    return ROLE_MAP_AM[name] || name;
  }
  return name;
}

const ROLE_DESC_MAP_AM: Record<string, string> = {
  'Full academy administration access': 'ሙሉ የአካዳሚ አስተዳደር መዳረሻ',
  'Manages the course catalog, categories, and promotional campaigns.':
    'የኮርስ ካታሎግ፣ ምድቦች እና ማስተዋወቂያዎችን ያስተዳድራል።',
  'Creates and manages courses, curriculum, and lesson content.':
    'ኮርሶችን፣ ስርዓተ ትምህርቶችን እና የትምህርት ይዘቶችን ይፈጥራል እንዲሁም ያስተዳድራል።',
  'Academy learner access': 'የአካዳሚ ተማሪ መዳረሻ',
};

export function translateRoleDescription(
  desc: string | null | undefined,
  locale: SupportedLocale,
): string {
  if (!desc) return '—';
  if (locale === 'am') {
    return ROLE_DESC_MAP_AM[desc] || desc;
  }
  return desc;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
