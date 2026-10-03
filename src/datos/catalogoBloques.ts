/**
 * Catálogo de bloques de seguimiento y sus etiquetas. Es el mismo contenido
 * que el servidor carga con el seed de las tablas `bloque` y `etiqueta`, y se
 * replica en la app para funcionar sin conexión.
 */
import { BloqueSeguimiento, Etiqueta } from '@/dominio';

const bloque = (clave: string, orden: number, etiquetas: string[]): BloqueSeguimiento => ({
  clave,
  orden,
  etiquetas: etiquetas.map((e, i) => ({ clave: `${clave}.${e}`, bloqueClave: clave, orden: i + 1 })),
});

export const BLOQUES: BloqueSeguimiento[] = [
  bloque('estudios', 1, ['examen', 'entrega', 'clase', 'estudie', 'aprobe']),
  bloque('descanso', 2, ['dormiBien', 'dormiMal', 'siesta', 'diaLibre']),
  bloque('hobbies', 3, ['lei', 'jugue', 'pinte', 'cocine', 'musica']),
  bloque('emociones', 4, ['alegria', 'tristeza', 'ansiedad', 'calma', 'enojo']),
  bloque('trabajo', 5, ['vacaciones', 'horasExtras', 'saliATiempo', 'reunionDificil', 'logro']),
  bloque('autocuidado', 6, ['meditacion', 'journaling', 'terapia', 'tiempoASolas']),
  bloque('salud', 7, ['medico', 'tomePastillas', 'meSentiMal', 'chequeo']),
  bloque('amor', 8, ['cita', 'conversacionLinda', 'discusion', 'extranoAAlguien']),
  bloque('tiempo', 9, ['tiempoLibre', 'ocupado', 'llegueTarde', 'llegueTemprano']),
  bloque('gente', 10, ['saliConAmigos', 'enFamilia', 'estuveSolo', 'conociAAlguien']),
  bloque('ejercicio', 11, ['camine', 'gimnasio', 'corri', 'yoga', 'noHiceNada']),
  bloque('comidas', 12, ['cocine', 'comiAfuera', 'comidaSaludable', 'comiDeMas', 'salteeComida']),
  bloque('eventos', 13, ['cumpleanos', 'viaje', 'celebracion', 'imprevisto']),
];

export const TODAS_LAS_ETIQUETAS: Etiqueta[] = BLOQUES.flatMap((b) => b.etiquetas);

export const claveTraduccionBloque = (clave: string): string => `block.${clave}`;

export const claveTraduccionEtiqueta = (clave: string): string => `blockOption.${clave}`;

export const bloquesActivos = (claves: string[]): BloqueSeguimiento[] =>
  BLOQUES.filter((b) => claves.includes(b.clave));
