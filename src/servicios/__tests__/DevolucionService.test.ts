import { describe, expect, it, jest } from '@jest/globals';
import type { ApiClient } from '@/api/ApiClient';
import { Devolucion, Devoluciones, TipoDevolucion } from '@/dominio';
import { devolucion } from '@/__pruebas__/fabricas';
import { DatosLocalesDevolucion, DevolucionService, ESPERA_DEVOLUCION_MS } from '../DevolucionService';

/** El teléfono, en memoria. */
class TelefonoFalso implements DatosLocalesDevolucion {
  readonly guardadas = new Map<string, Record<TipoDevolucion, Devolucion | null>>();
  guardar = async (usuarioId: string, d: Devolucion) => {
    this.guardadas.set(usuarioId, { ...(this.guardadas.get(usuarioId) ?? { rapida: null, semanal: null }), [d.tipo]: d });
  };
  obtener = async (usuarioId: string) => this.guardadas.get(usuarioId) ?? { rapida: null, semanal: null };
}

function apiQueResponde(respuesta: Devoluciones | Error) {
  const post = jest.fn(async (_ruta: string, _cuerpo?: unknown, _opciones?: unknown) => {
    if (respuesta instanceof Error) throw respuesta;
    return respuesta;
  });
  return { api: { post } as unknown as Pick<ApiClient, 'post'>, post };
}

describe('DevolucionService', () => {
  it('pide las vigentes con más tiempo de espera, porque puede estar escribiéndolas la IA', async () => {
    const { api, post } = apiQueResponde({ rapida: null, semanal: null, cuidado: null });

    await new DevolucionService(api, new TelefonoFalso()).pedir('lucia');

    expect(post).toHaveBeenCalledWith('/devoluciones/actual', undefined, { tiempoMaximoMs: ESPERA_DEVOLUCION_MS });
  });

  it('guarda en el teléfono las que llegan, para verlas sin conexión; el mensaje de cuidado no', async () => {
    const rapida = devolucion('rapida', '2026-10-29');
    const semanal = devolucion('semanal', '2026-10-25');
    const cuidado = { titulo: 'No tenés que pasar esto en soledad', mensaje: '…', lineas: [], aclaracion: '…' };
    const telefono = new TelefonoFalso();
    const servicio = new DevolucionService(apiQueResponde({ rapida, semanal, cuidado }).api, telefono);

    expect(await servicio.pedir('lucia')).toEqual({ rapida, semanal, cuidado });
    expect(await servicio.guardadas('lucia')).toEqual({ rapida, semanal, cuidado: null });
  });

  it('si no hay conexión, lo guardado queda como estaba', async () => {
    const telefono = new TelefonoFalso();
    const anterior = devolucion('rapida', '2026-10-28');
    await telefono.guardar('lucia', anterior);

    await expect(new DevolucionService(apiQueResponde(new Error('sin red')).api, telefono).pedir('lucia')).rejects.toThrow();
    expect((await telefono.obtener('lucia')).rapida).toEqual(anterior);
  });
});
