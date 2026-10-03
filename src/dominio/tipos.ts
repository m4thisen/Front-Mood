/**
 * Enumeraciones del modelo de entidades (diagrama de clases — Modelo de
 * entidades). Nivel de ánimo y clima no son tablas: son valores
 * restringidos, y sus nombres y colores viven en la app con las traducciones.
 */

/** 1 = MUY_MAL · 2 = MAL · 3 = NEUTRAL · 4 = BIEN · 5 = GENIAL */
export type NivelAnimo = 1 | 2 | 3 | 4 | 5;

export const NIVELES_ANIMO: readonly NivelAnimo[] = [1, 2, 3, 4, 5];

/** RN-06: un día admite más de un clima (por ejemplo, soleado y frío). */
export const CLIMAS = ['SOLEADO', 'NUBLADO', 'LLUVIA', 'FRIO', 'CALOR'] as const;
export type Clima = (typeof CLIMAS)[number];

export type TipoTag = 'SI_NO' | 'TEXTO';

export type Idioma = 'es' | 'en';

export const GENEROS = ['FEMENINO', 'MASCULINO', 'NO_BINARIO', 'PREFIERO_NO_DECIR'] as const;
export type Genero = (typeof GENEROS)[number];

/** RF-25: cada cuántos días se genera la devolución rápida de IA. */
export const FRECUENCIAS_IA = [1, 3, 7, 14] as const;
export type FrecuenciaIA = (typeof FRECUENCIAS_IA)[number];
