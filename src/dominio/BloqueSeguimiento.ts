/**
 * Catálogo predefinido: cada bloque agrupa etiquetas (ej. "Estudios" →
 * "Examen", "Entrega", "Clase"). El usuario elige qué bloques sigue y marca
 * en cada registro las etiquetas que correspondan.
 */
export interface Etiqueta {
  /** Única en todo el catálogo, ej. "estudios.examen". */
  clave: string;
  bloqueClave: string;
  orden: number;
}

export interface BloqueSeguimiento {
  clave: string;
  orden: number;
  etiquetas: Etiqueta[];
}
