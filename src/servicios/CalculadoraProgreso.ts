/**
 * CalculadoraProgreso — servicio del dispositivo (diagrama de clases de la
 * aplicación móvil). Calcula los indicadores de constancia a partir de los
 * registros: racha actual (RN-04), racha máxima y "Color del Alma" (RN-05).
 * No se almacenan: se recalculan siempre desde el historial.
 */
import { subDays } from 'date-fns';
import { EntriesByDate } from '@/types/models';
import { getMoodColor } from '@/tema/colors';
import { averageColors } from '@/utils/color';
import { toISODate, todayISO } from '@/utils/fecha';

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

/** "Color del Alma": promedio de todos los colores de mood registrados. */
export const computeSoulColor = (entries: EntriesByDate): string | null => {
  const colors = Object.values(entries).map((e) => getMoodColor(e.mood));
  return averageColors(colors);
};
