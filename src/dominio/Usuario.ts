import { differenceInYears, parseISO } from 'date-fns';
import { FrecuenciaIA, Genero, Idioma } from './tipos';

/** Perfil y preferencias del usuario (entidad Usuario). */
export interface Usuario {
  id: string;
  nombre: string;
  /** yyyy-mm-dd. La edad no se guarda: se calcula con calcularEdad(). */
  fechaNacimiento: string;
  genero: Genero;
  idioma: Idioma;
  /** HH:mm, en la zona horaria del usuario. */
  horaRecordatorio: string;
  frecuenciaIA: FrecuenciaIA;
  /** "El día de hoy" depende de dónde está el usuario (ej. America/Argentina/Buenos_Aires). */
  zonaHoraria: string;
  /** Claves de los bloques de seguimiento activos. Ninguno viene activo por defecto. */
  bloquesActivos: string[];
  onboardingCompleto: boolean;
}

export const HORA_RECORDATORIO_POR_DEFECTO = '21:00';

/** Igual que VARCHAR(80) en la base. */
export const LARGO_MAXIMO_NOMBRE = 80;

export function calcularEdad(fechaNacimiento: string, hoy: Date = new Date()): number {
  return differenceInYears(hoy, parseISO(fechaNacimiento));
}

export function zonaHorariaDelDispositivo(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

/** Separa "HH:mm" en números, para los pickers y las notificaciones. */
export function partesHora(hora: string): { hora: number; minuto: number } {
  const [h, m] = hora.split(':').map(Number);
  return { hora: h, minuto: m };
}

export function formatearHora(hora: number, minuto: number): string {
  const dosDigitos = (n: number) => n.toString().padStart(2, '0');
  return `${dosDigitos(hora)}:${dosDigitos(minuto)}`;
}
