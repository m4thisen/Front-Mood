import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Language } from '@/types/models';
import es from './es';
import en from './en';

const dictionaries: Record<Language, Record<string, string>> = { es, en };

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{
  initialLanguage?: Language;
  children: React.ReactNode;
}> = ({ initialLanguage = 'es', children }) => {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  const t = useCallback(
    (key: string) => dictionaries[language][key] ?? dictionaries.es[key] ?? key,
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return React.createElement(I18nContext.Provider, { value }, children);
};

export const useTranslation = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
};
