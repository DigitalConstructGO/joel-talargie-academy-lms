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

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
