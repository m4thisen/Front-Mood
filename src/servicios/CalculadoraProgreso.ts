/**
 * CalculadoraProgreso — «servicio» en el diagrama de clases de la aplicación
 * móvil. Calcula los indicadores de constancia a partir de los registros:
 * racha actual (RN-04), racha máxima, días registrados y "Color del Alma"
 * (RN-05). No se almacenan: se recalculan siempre desde el historial, así
 * nunca quedan inconsistentes.
 */
import { differenceInCalendarDays, parseISO, subDays } from 'date-fns';
import { RegistroDiario } from '@/dominio';
import { getMoodColor } from '@/tema/colors';
import { averageColors } from '@/utils/color';
import { toISODate } from '@/utils/fecha';

/**
 * RN-04: días consecutivos con registro hasta hoy, o hasta ayer si todavía
 * no se registró hoy (la racha no se "rompe" antes de que termine el día).
 */
export function rachaActual(registros: RegistroDiario[], hoy: string): number {
  const fechas = new Set(registros.map((r) => r.fecha));
  let cursor = parseISO(hoy);
  if (!fechas.has(hoy)) cursor = subDays(cursor, 1);

  let racha = 0;
  while (fechas.has(toISODate(cursor))) {
    racha += 1;
    cursor = subDays(cursor, 1);
  }
  return racha;
}

/** La racha más larga de todo el historial, no solo la actual. */
export function rachaMaxima(registros: RegistroDiario[]): number {
  const fechas = Array.from(new Set(registros.map((r) => r.fecha))).sort();
  if (fechas.length === 0) return 0;

  let maxima = 1;
  let actual = 1;
  for (let i = 1; i < fechas.length; i += 1) {
    const consecutivo = differenceInCalendarDays(parseISO(fechas[i]), parseISO(fechas[i - 1])) === 1;
    actual = consecutivo ? actual + 1 : 1;
    maxima = Math.max(maxima, actual);
  }
  return maxima;
}

export function diasRegistrados(registros: RegistroDiario[]): number {
  return new Set(registros.map((r) => r.fecha)).size;
}

/** RN-05: promedio de los colores de todos los niveles de ánimo registrados. */
export function colorDelAlma(registros: RegistroDiario[]): string | null {
  return averageColors(registros.map((r) => getMoodColor(r.nivelAnimo)));
}
