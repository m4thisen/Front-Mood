/**
 * MusicaService — búsqueda de la canción del día en Spotify (CU-10), a
 * través del servidor. Si no se puede buscar (sin conexión, o Spotify no
 * responde), el formulario guarda la canción tal como se escribió.
 */
import type { ApiClient } from '@/api/ApiClient';
import type { BusquedaMusicaApi } from '@/api/musica';
import { Cancion } from '@/dominio';

/** Desde cuántas letras se busca: con menos, Spotify devuelve cualquier cosa. */
export const MINIMO_LETRAS_BUSQUEDA = 2;

export class MusicaService {
  constructor(private readonly api: Pick<ApiClient, 'get'>) {}

  async buscar(consulta: string): Promise<Cancion[]> {
    const texto = consulta.trim().slice(0, 100);
    if (texto.length < MINIMO_LETRAS_BUSQUEDA) return [];
    const { canciones } = await this.api.get<BusquedaMusicaApi>(`/musica/buscar?q=${encodeURIComponent(texto)}`);
    return canciones.filter((c) => c.spotifyId && c.titulo);
  }
}
