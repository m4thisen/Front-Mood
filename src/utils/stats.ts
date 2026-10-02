import { subDays } from 'date-fns';
import { DayEntry, EntriesByDate } from '@/types/models';
import { getMoodColor } from '@/theme/colors';
import { averageColors } from './color';
import { toISODate, todayISO } from './date';

/** Racha de días consecutivos registrados, tolerante si hoy todavía no se cargó. */
export const computeStreak = (entries: EntriesByDate): number => {
  const today = todayISO();
  let count = 0;

  // Si hoy está cargado, arranca contando desde hoy; si no, desde ayer
  // (para no "romper" la racha antes de que termine el día).
  let date = entries[today] ? new Date() : subDays(new Date(), 1);
  while (entries[toISODate(date)]) {
    count += 1;
    date = subDays(date, 1);
  }
  return count;
};

/** "Color del Alma": promedio de todos los colores de mood registrados. */
export const computeSoulColor = (entries: EntriesByDate): string | null => {
  const colors = Object.values(entries).map((e) => getMoodColor(e.mood));
  return averageColors(colors);
};

export interface TagFrequency {
  id: string;
  count: number;
}

/** Ranking de opciones/tags más elegidas en general. */
export const computeTopTags = (entries: EntriesByDate, limit = 5): TagFrequency[] => {
  const counts = new Map<string, number>();
  Object.values(entries).forEach((entry) => {
    entry.selectedOptions.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  });
  return Array.from(counts.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/** Ánimo promedio los días en que se marcó cada opción, vs. el resto. */
export const computeMoodByOption = (
  entries: EntriesByDate,
  optionId: string
): { withOption: number; overall: number } | null => {
  const all = Object.values(entries);
  if (all.length === 0) return null;
  const withOption = all.filter((e) => e.selectedOptions.includes(optionId));
  if (withOption.length === 0) return null;
  const avg = (list: DayEntry[]) => list.reduce((sum, e) => sum + e.mood, 0) / list.length;
  return { withOption: avg(withOption), overall: avg(all) };
};

/** Distribución de a qué hora del día se suele registrar (mañana/tarde/noche/madrugada). */
export const computeLoggingTimeBucket = (entries: EntriesByDate): string | null => {
  const all = Object.values(entries);
  if (all.length === 0) return null;
  const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  all.forEach((e) => {
    const h = e.loggedAtHour;
    if (h >= 6 && h < 12) buckets.morning += 1;
    else if (h >= 12 && h < 18) buckets.afternoon += 1;
    else if (h >= 18 && h < 24) buckets.evening += 1;
    else buckets.night += 1;
  });
  const entries2 = Object.entries(buckets) as [keyof typeof buckets, number][];
  entries2.sort((a, b) => b[1] - a[1]);
  return entries2[0][0];
};

export const computeAverageMood = (entries: EntriesByDate): number | null => {
  const all = Object.values(entries);
  if (all.length === 0) return null;
  return all.reduce((sum, e) => sum + e.mood, 0) / all.length;
};

/** Cuántos días se registraron en cada nivel de ánimo (1 a 5). */
export const computeMoodDistribution = (entries: EntriesByDate): number[] => {
  const counts = [0, 0, 0, 0, 0];
  Object.values(entries).forEach((e) => {
    counts[e.mood - 1] += 1;
  });
  return counts;
};

/** Racha más larga registrada en todo el historial (no solo la actual). */
export const computeLongestStreak = (entries: EntriesByDate): number => {
  const dates = Object.keys(entries).sort();
  if (dates.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i += 1) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
};

/** Día de la semana con mejor ánimo promedio (necesita al menos 2 registros en ese día). */
export const computeBestWeekday = (
  entries: EntriesByDate
): { weekday: number; avg: number } | null => {
  const all = Object.values(entries);
  if (all.length < 4) return null;

  const buckets: DayEntry[][] = [[], [], [], [], [], [], []];
  all.forEach((e) => {
    const day = new Date(e.date).getDay();
    buckets[day].push(e);
  });

  let best: { weekday: number; avg: number } | null = null;
  buckets.forEach((list, weekday) => {
    if (list.length < 2) return;
    const avg = list.reduce((sum, e) => sum + e.mood, 0) / list.length;
    if (!best || avg > best.avg) best = { weekday, avg };
  });

  return best;
};
