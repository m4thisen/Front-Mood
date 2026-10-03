/**
 * MotorEstadistico — «servicio» en el diagrama de clases de la aplicación
 * móvil. Calcula las estadísticas sobre el historial local, en el propio
 * dispositivo y sin conexión (CU-17). La relación entre hábitos y ánimo
 * (CU-18, con el umbral de RN-08) se completa en la iteración 4.
 */
import { getDay, parseISO } from 'date-fns';
import { RegistroDiario } from '@/dominio';

export function promedio(registros: RegistroDiario[]): number | null {
  if (registros.length === 0) return null;
  return registros.reduce((suma, r) => suma + r.nivelAnimo, 0) / registros.length;
}

/** Cuántos días se registraron en cada nivel de ánimo (posición 0 = nivel 1). */
export function distribucion(registros: RegistroDiario[]): number[] {
  const cantidades = [0, 0, 0, 0, 0];
  registros.forEach((r) => {
    cantidades[r.nivelAnimo - 1] += 1;
  });
  return cantidades;
}

/**
 * Día de la semana (0 = domingo) con mejor ánimo promedio. Exige al menos
 * 4 registros en total y 2 en ese día para no sacar conclusiones de un dato.
 */
export function mejorDiaSemana(
  registros: RegistroDiario[]
): { diaSemana: number; promedio: number } | null {
  if (registros.length < 4) return null;

  const porDia: RegistroDiario[][] = [[], [], [], [], [], [], []];
  // parseISO interpreta la fecha en hora local; new Date('yyyy-mm-dd') la
  // toma como UTC y en Argentina corre el día hacia atrás.
  registros.forEach((r) => porDia[getDay(parseISO(r.fecha))].push(r));

  let mejor: { diaSemana: number; promedio: number } | null = null;
  porDia.forEach((lista, diaSemana) => {
    if (lista.length < 2) return;
    const prom = promedio(lista)!;
    if (!mejor || prom > mejor.promedio) mejor = { diaSemana, promedio: prom };
  });
  return mejor;
}

export type FranjaHoraria = 'MANANA' | 'TARDE' | 'NOCHE' | 'MADRUGADA';

/** Franja del día en la que el usuario suele registrar. */
export function franjaHoraria(registros: RegistroDiario[]): FranjaHoraria | null {
  if (registros.length === 0) return null;
  const cantidades: Record<FranjaHoraria, number> = { MANANA: 0, TARDE: 0, NOCHE: 0, MADRUGADA: 0 };
  registros.forEach((r) => {
    const hora = new Date(r.horaCarga).getHours();
    if (hora >= 6 && hora < 12) cantidades.MANANA += 1;
    else if (hora >= 12 && hora < 18) cantidades.TARDE += 1;
    else if (hora >= 18) cantidades.NOCHE += 1;
    else cantidades.MADRUGADA += 1;
  });
  return (Object.entries(cantidades) as [FranjaHoraria, number][]).sort((a, b) => b[1] - a[1])[0][0];
}

export interface FrecuenciaEtiqueta {
  clave: string;
  cantidad: number;
}

/** Etiquetas más marcadas, de mayor a menor. */
export function frecuencias(registros: RegistroDiario[], limite = 5): FrecuenciaEtiqueta[] {
  const cantidades = new Map<string, number>();
  registros.forEach((r) => r.etiquetas.forEach((c) => cantidades.set(c, (cantidades.get(c) ?? 0) + 1)));
  return Array.from(cantidades, ([clave, cantidad]) => ({ clave, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limite);
}

/**
 * Ánimo promedio de los días con una etiqueta frente al promedio general.
 * Versión provisoria que usan las devoluciones simuladas; la reemplaza
 * animoSegunHabito en la iteración 4.
 */
export function animoConEtiqueta(
  registros: RegistroDiario[],
  claveEtiqueta: string
): { conEtiqueta: number; general: number } | null {
  const con = registros.filter((r) => r.etiquetas.includes(claveEtiqueta));
  if (con.length === 0) return null;
  return { conEtiqueta: promedio(con)!, general: promedio(registros)! };
}
