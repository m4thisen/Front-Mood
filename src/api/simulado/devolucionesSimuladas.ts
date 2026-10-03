/**
 * Todo lo de acá adentro es MOCK — imita lo que devolvería un modelo de
 * lenguaje real para poder mostrar la funcionalidad completa sin depender
 * todavía de una API. El día que se conecte un modelo real (Anthropic u
 * otro), estas tres funciones son las únicas que hay que reemplazar: la
 * firma (qué reciben, qué devuelven) puede quedar igual.
 */
import { subDays } from 'date-fns';
import { DayEntry, EntriesByDate, Language, MoodLevel } from '@/types/models';
import { ALL_OPTIONS, getOptionCategoryIcon, getOptionLabelKey } from '@/datos/catalogoBloques';
import { computeMoodByOption } from '@/servicios/MotorEstadistico';

const inLastNDays = (entries: DayEntry[], n: number): DayEntry[] => {
  const cutoff = subDays(new Date(), n);
  return entries.filter((e) => new Date(e.date) >= cutoff);
};

const average = (list: DayEntry[]): number | null =>
  list.length === 0 ? null : list.reduce((sum, e) => sum + e.mood, 0) / list.length;

const mostFrequentOptionLabel = (list: DayEntry[], t: (k: string) => string): string | null => {
  const counts = new Map<string, number>();
  list.forEach((e) => e.selectedOptions.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
  if (counts.size === 0) return null;
  const [topId] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  return t(getOptionLabelKey(topId));
};

/** Resumen de "cómo venís" — compara los últimos 7 días contra los 7 anteriores. */
export function generateAiSummary(
  entries: EntriesByDate,
  streak: number,
  t: (key: string) => string
): string | null {
  const all = Object.values(entries);
  if (all.length < 3) return null;

  const last7 = inLastNDays(all, 7);
  const prev7 = inLastNDays(all, 14).filter((e) => !last7.includes(e));

  const avgLast = average(last7) ?? average(all)!;
  const avgPrev = average(prev7);
  const topTag = mostFrequentOptionLabel(last7.length > 0 ? last7 : all, t);

  let templateKey: 'ai.template.improving' | 'ai.template.declining' | 'ai.template.stable' =
    'ai.template.stable';
  if (avgPrev !== null) {
    if (avgLast - avgPrev > 0.35) templateKey = 'ai.template.improving';
    else if (avgPrev - avgLast > 0.35) templateKey = 'ai.template.declining';
  }

  let text = t(templateKey)
    .replace('{avg}', avgLast.toFixed(1))
    .replace('{tag}', topTag ?? t('ai.genericTag'));

  if (streak >= 3) {
    text += ' ' + t('ai.template.streak').replace('{streak}', String(streak));
  }

  return text;
}

/** Playlists sugeridas según el ánimo dominante de los últimos días. */
interface MockPlaylist {
  title: string;
  subtitle: string;
}

const PLAYLISTS_BY_MOOD: Record<MoodLevel, { es: MockPlaylist[]; en: MockPlaylist[] }> = {
  1: {
    es: [
      { title: 'Soltar la bronca', subtitle: 'Rock crudo para descargar' },
      { title: 'Respirar hondo', subtitle: 'Instrumental para bajar un cambio' },
    ],
    en: [
      { title: 'Let it out', subtitle: 'Raw rock to release tension' },
      { title: 'Deep breath', subtitle: 'Instrumental to cool down' },
    ],
  },
  2: {
    es: [
      { title: 'Un lugar seguro', subtitle: 'Voces suaves, poco ruido' },
      { title: 'De a poco', subtitle: 'Acústico calmo' },
    ],
    en: [
      { title: 'Safe place', subtitle: 'Soft vocals, low noise' },
      { title: 'One step at a time', subtitle: 'Calm acoustic' },
    ],
  },
  3: {
    es: [
      { title: 'Piloto automático', subtitle: 'Lo-fi para acompañar' },
      { title: 'Ni fu ni fa', subtitle: 'Indie tranquilo' },
    ],
    en: [
      { title: 'Autopilot', subtitle: 'Lo-fi to keep you company' },
      { title: 'Middle ground', subtitle: 'Chill indie' },
    ],
  },
  4: {
    es: [
      { title: 'Buena onda', subtitle: 'Pop soleado' },
      { title: 'Ligero', subtitle: 'Indie pop con groove' },
    ],
    en: [
      { title: 'Good vibes', subtitle: 'Sunny pop' },
      { title: 'Light', subtitle: 'Indie pop with groove' },
    ],
  },
  5: {
    es: [
      { title: 'A todo volumen', subtitle: 'Pop / dance para celebrar' },
      { title: 'Subidón', subtitle: 'Energía pura' },
    ],
    en: [
      { title: 'Full volume', subtitle: 'Pop / dance to celebrate' },
      { title: 'On a high', subtitle: 'Pure energy' },
    ],
  },
};

export function generateRecommendedPlaylists(
  entries: EntriesByDate,
  language: Language
): MockPlaylist[] {
  const all = Object.values(entries);
  const recent = inLastNDays(all, 7);
  const source = recent.length > 0 ? recent : all;
  if (source.length === 0) return PLAYLISTS_BY_MOOD[3][language];

  const avg = average(source)!;
  const level = Math.min(5, Math.max(1, Math.round(avg))) as MoodLevel;
  return PLAYLISTS_BY_MOOD[level][language];
}

/** Hábitos recomendados, ordenados por correlación con mejor ánimo. */
export interface RecommendedHabit {
  label: string;
  reason: string;
  icon: string;
  percent: number | null; // null = todavía no hay suficiente dato para un %
}

const GENERIC_HABITS_KEYS = ['descanso.dormiBien', 'ejercicio.camine', 'gente.saliConAmigos'];

export function generateRecommendedHabits(
  entries: EntriesByDate,
  t: (key: string) => string
): RecommendedHabit[] {
  const all = Object.values(entries);

  if (all.length < 5) {
    return GENERIC_HABITS_KEYS.map((id) => ({
      label: t(getOptionLabelKey(id)),
      reason: t('ai.habits.genericReason'),
      icon: getOptionCategoryIcon(id),
      percent: null,
    }));
  }

  const scored = ALL_OPTIONS.map((option) => {
    const comparison = computeMoodByOption(entries, option.id);
    if (!comparison) return null;
    return { option, diff: comparison.withOption - comparison.overall };
  })
    .filter((x): x is { option: (typeof ALL_OPTIONS)[number]; diff: number } => x !== null && x.diff > 0.15)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 4);

  if (scored.length === 0) {
    return GENERIC_HABITS_KEYS.map((id) => ({
      label: t(getOptionLabelKey(id)),
      reason: t('ai.habits.genericReason'),
      icon: getOptionCategoryIcon(id),
      percent: null,
    }));
  }

  return scored.map(({ option, diff }) => ({
    label: t(option.labelKey),
    reason: t('ai.habits.correlationReason').replace('{percent}', Math.round(diff * 20).toString()),
    icon: getOptionCategoryIcon(option.id),
    percent: Math.round(diff * 20),
  }));
}
