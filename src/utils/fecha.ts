import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Idioma } from '@/dominio';

export const toISODate = (date: Date): string => format(date, 'yyyy-MM-dd');

export const todayISO = (): string => toISODate(new Date());

export const dateLocale = (lang: Idioma) => (lang === 'es' ? es : enUS);

/**
 * Devuelve una grilla de semanas (arrays de 7 fechas) que cubre el mes
 * completo, incluyendo días de relleno del mes anterior/siguiente para
 * completar semanas de domingo a sábado.
 */
export const getMonthGrid = (year: number, month: number): Date[][] => {
  const first = startOfMonth(new Date(year, month, 1));
  const last = endOfMonth(first);
  const gridStart = startOfWeek(first, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(last, { weekStartsOn: 0 });

  const days: Date[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
};

export const monthLabel = (year: number, month: number, lang: Idioma): string =>
  format(new Date(year, month, 1), 'MMMM yyyy', { locale: dateLocale(lang) });

export const weekdayLabels = (lang: Idioma): string[] => {
  const base = startOfWeek(new Date(), { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(base, i), 'EEEEE', { locale: dateLocale(lang) }).toUpperCase()
  );
};

/** Nombre completo de un día de la semana (0 = domingo .. 6 = sábado). */
export const weekdayName = (weekday: number, lang: Idioma): string => {
  // 1 de enero de 2023 fue domingo — se usa como semana de referencia fija.
  const referenceSunday = new Date(2023, 0, 1);
  return format(addDays(referenceSunday, weekday), 'EEEE', { locale: dateLocale(lang) });
};
