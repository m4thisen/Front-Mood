/**
 * Devoluciones de IA simuladas. Imitan lo que va a devolver el servidor para
 * poder mostrar la funcionalidad completa sin depender todavía de Claude.
 * En la iteración 5 se reemplazan por POST /devoluciones/actual (con el
 * servidor simulado detrás de ApiClient mientras no exista el real).
 */
import { parseISO, subDays } from 'date-fns';
import { Idioma, NivelAnimo, RegistroDiario } from '@/dominio';
import { claveTraduccionEtiqueta, iconoDeEtiqueta, TODAS_LAS_ETIQUETAS } from '@/datos/catalogoBloques';
import { animoConEtiqueta } from '@/servicios/MotorEstadistico';

const inLastNDays = (registros: RegistroDiario[], n: number): RegistroDiario[] => {
  const cutoff = subDays(new Date(), n);
  return registros.filter((r) => parseISO(r.fecha) >= cutoff);
};

const average = (list: RegistroDiario[]): number | null =>
  list.length === 0 ? null : list.reduce((sum, r) => sum + r.nivelAnimo, 0) / list.length;

const mostFrequentOptionLabel = (list: RegistroDiario[], t: (k: string) => string): string | null => {
  const counts = new Map<string, number>();
  list.forEach((r) => r.etiquetas.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
  if (counts.size === 0) return null;
  const [topId] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  return t(claveTraduccionEtiqueta(topId));
};

/** Resumen de "cómo venís" — compara los últimos 7 días contra los 7 anteriores. */
export function generateAiSummary(
  all: RegistroDiario[],
  streak: number,
  t: (key: string) => string
): string | null {
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

const PLAYLISTS_BY_MOOD: Record<NivelAnimo, { es: MockPlaylist[]; en: MockPlaylist[] }> = {
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
  all: RegistroDiario[],
  language: Idioma
): MockPlaylist[] {
  const recent = inLastNDays(all, 7);
  const source = recent.length > 0 ? recent : all;
  if (source.length === 0) return PLAYLISTS_BY_MOOD[3][language];

  const avg = average(source)!;
  const level = Math.min(5, Math.max(1, Math.round(avg))) as NivelAnimo;
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
  all: RegistroDiario[],
  t: (key: string) => string
): RecommendedHabit[] {

  if (all.length < 5) {
    return GENERIC_HABITS_KEYS.map((id) => ({
      label: t(claveTraduccionEtiqueta(id)),
      reason: t('ai.habits.genericReason'),
      icon: iconoDeEtiqueta(id),
      percent: null,
    }));
  }

  const scored = TODAS_LAS_ETIQUETAS.map((etiqueta) => {
    const comparison = animoConEtiqueta(all, etiqueta.clave);
    if (!comparison) return null;
    return { clave: etiqueta.clave, diff: comparison.conEtiqueta - comparison.general };
  })
    .filter((x): x is { clave: string; diff: number } => x !== null && x.diff > 0.15)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 4);

  if (scored.length === 0) {
    return GENERIC_HABITS_KEYS.map((id) => ({
      label: t(claveTraduccionEtiqueta(id)),
      reason: t('ai.habits.genericReason'),
      icon: iconoDeEtiqueta(id),
      percent: null,
    }));
  }

  return scored.map(({ clave, diff }) => ({
    label: t(claveTraduccionEtiqueta(clave)),
    reason: t('ai.habits.correlationReason').replace('{percent}', Math.round(diff * 20).toString()),
    icon: iconoDeEtiqueta(clave),
    percent: Math.round(diff * 20),
  }));
}
