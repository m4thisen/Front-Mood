import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Idioma } from '@/dominio';
import es from './es';
import en from './en';

const dictionaries: Record<Idioma, Record<string, string>> = { es, en };

/** El idioma que se ve ahora en la app, para lo que no es una pantalla (avisos, diálogos del sistema). */
let idiomaVisible: Idioma = 'es';
export const idiomaActual = (): Idioma => idiomaVisible;

/**
 * Traduce fuera de las pantallas (servicios, notificaciones). Los valores
 * reemplazan sus marcas: traducir('en', 'stepper.more', { titulo: 'Sueño' }).
 */
export function traducir(idioma: Idioma, clave: string, valores: Record<string, string | number> = {}): string {
  const texto = dictionaries[idioma][clave] ?? dictionaries.es[clave] ?? clave;
  return Object.entries(valores).reduce((resultado, [marca, valor]) => resultado.replaceAll(`{${marca}}`, String(valor)), texto);
}

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
  idiomaVisible = language;

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
