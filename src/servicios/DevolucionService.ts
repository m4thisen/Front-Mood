/**
 * DevolucionService — trae las devoluciones de "Cómo venís" (CU-21). El
 * servidor decide si toca una nueva (CU-19) y la genera; acá se guarda la
 * última de cada tipo para verla sin conexión.
 */
import type { ApiClient } from '@/api/ApiClient';
import type { DevolucionesApi } from '@/api/devoluciones';
import { Devolucion, Devoluciones, TipoDevolucion } from '@/dominio';

/** Lo que necesita de la base local (DevolucionLocalRepository). */
export interface DatosLocalesDevolucion {
  guardar(usuarioId: string, devolucion: Devolucion): Promise<void>;
  obtener(usuarioId: string): Promise<Record<TipoDevolucion, Devolucion | null>>;
}

/** Cuando toca una nueva, el servidor espera a que la escriba la IA y a que Spotify encuentre las canciones. */
export const ESPERA_DEVOLUCION_MS = 60_000;

export class DevolucionService {
  constructor(
    private readonly api: Pick<ApiClient, 'post'>,
    private readonly local: DatosLocalesDevolucion
  ) {}

  /** Las últimas guardadas en el teléfono. */
  async guardadas(usuarioId: string): Promise<Devoluciones> {
    return { ...(await this.local.obtener(usuarioId)), cuidado: null };
  }

  /** Pide las vigentes al servidor (que genera las que tocan) y guarda la copia local. */
  async pedir(usuarioId: string): Promise<Devoluciones> {
    const actuales = await this.api.post<DevolucionesApi>('/devoluciones/actual', undefined, { tiempoMaximoMs: ESPERA_DEVOLUCION_MS });
    for (const devolucion of [actuales.rapida, actuales.semanal]) {
      if (devolucion) await this.local.guardar(usuarioId, devolucion);
    }
    return actuales;
  }
}
