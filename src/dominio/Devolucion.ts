/**
 * Devoluciones de "Cómo venís" (CU-19, CU-21). Las genera el servidor: Claude
 * las redacta a partir de lo que calculó el núcleo de IA, y los números
 * (patrones, días) salen de ese cálculo, no de Claude.
 */
import { Cancion } from './Cancion';
import { Idioma } from './tipos';

export type TipoDevolucion = 'rapida' | 'semanal';

/** Algo que suele acompañar a la persona, con la frase de Claude y los días en que se vio. */
export interface PatronDevolucion {
  marca: string;
  nombre: string;
  texto: string;
  /** Positivo: esos días suele estar mejor; negativo, peor. */
  efecto: number;
  dias: number;
}

export interface Devolucion {
  id: string;
  tipo: TipoDevolucion;
  /** En qué idioma la escribió la IA: el de la app. Si cambia, el servidor la reescribe. */
  idioma: Idioma;
  /** yyyy-mm-dd: el período que cubre. */
  desde: string;
  hasta: string;
  generadaEn: string;
  titulo: string;
  resumen: string;
  patrones: PatronDevolucion[];
  /** Solo en la rápida, y solo si había algo que decir de mañana. */
  manana: string | null;
  sugerencia: string;
  /** Solo en la rápida. Sin spotifyId si Spotify no respondió. */
  canciones: Cancion[];
}

export interface LineaDeAyuda {
  nombre: string;
  numero: string;
  /** Lo que se marca. */
  marcar: string;
  detalle: string;
}

/** Lo escribe el equipo, no la IA: va en lugar de la devolución si el texto de hoy tiene señales claras de riesgo. */
export interface MensajeCuidado {
  titulo: string;
  mensaje: string;
  lineas: LineaDeAyuda[];
  aclaracion: string;
}

export interface Devoluciones {
  rapida: Devolucion | null;
  semanal: Devolucion | null;
  cuidado: MensajeCuidado | null;
}

export const SIN_DEVOLUCIONES: Devoluciones = { rapida: null, semanal: null, cuidado: null };
