import { TipoTag } from './tipos';

/**
 * Tag que crea el usuario (ej. "Vendí un auto"). Eliminar un tag lo
 * desactiva: los valores ya guardados en registros anteriores siguen
 * teniendo a qué referirse.
 */
export interface TagPersonalizado {
  id: string;
  nombre: string;
  tipo: TipoTag;
  activo: boolean;
}

/** Igual que VARCHAR(40) en la base. */
export const LARGO_MAXIMO_NOMBRE_TAG = 40;

export type ErrorTag = 'NOMBRE_VACIO' | 'NOMBRE_REPETIDO' | 'NOMBRE_MUY_LARGO';

export function validarNombreTag(
  nombre: string,
  existentes: TagPersonalizado[],
  idEditado?: string
): ErrorTag | null {
  const limpio = nombre.trim();
  if (limpio.length === 0) return 'NOMBRE_VACIO';
  if (limpio.length > LARGO_MAXIMO_NOMBRE_TAG) return 'NOMBRE_MUY_LARGO';
  const repetido = existentes.some(
    (t) => t.activo && t.id !== idEditado && t.nombre.toLowerCase() === limpio.toLowerCase()
  );
  return repetido ? 'NOMBRE_REPETIDO' : null;
}
