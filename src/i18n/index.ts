import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Idioma } from '@/dominio';
import es from './es';
import en from './en';

const dictionaries: Record<Idioma, Record<string, string>> = { es, en };

interface I18nContextValue {
  language: Idioma;
  setLanguage: (lang: Idioma) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{
  initialLanguage?: Idioma;
  children: React.ReactNode;
}> = ({ initialLanguage = 'es', children }) => {
  const [language, setLanguage] = useState<Idioma>(initialLanguage);

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
