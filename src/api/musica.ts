/**
 * Forma en que el servidor manda las canciones (GET /musica/buscar): las
 * mismas que guarda el registro del día.
 */
import { Cancion } from '@/dominio';

export interface BusquedaMusicaApi {
  canciones: Cancion[];
}
