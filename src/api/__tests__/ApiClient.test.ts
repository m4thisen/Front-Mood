import { describe, expect, it, jest } from '@jest/globals';
import { respuesta, URL_FALSA } from '@/__pruebas__/servidorFalso';
import { ApiClient, ErrorApi, PedirHttp, ProveedorSesion } from '../ApiClient';

function armar(fetchFalso: PedirHttp, sesion: Partial<ProveedorSesion> = {}, tiempoMaximoMs?: number) {
  const proveedor: ProveedorSesion = {
    tokenAcceso: async () => 'token-1',
    renovar: async () => 'token-2',
    ...sesion,
  };
  const fetchEspia = jest.fn(fetchFalso);
  return { api: new ApiClient(URL_FALSA, proveedor, fetchEspia, tiempoMaximoMs), fetchEspia, proveedor };
}

const encabezados = (llamada: unknown[]) => (llamada[1] as RequestInit).headers as Record<string, string>;

describe('ApiClient', () => {
  it('adjunta el token de acceso a las rutas con sesión', async () => {
    const { api, fetchEspia } = armar(async () => respuesta(200, { ok: true }));

    expect(await api.get('/usuarios/me')).toEqual({ ok: true });
    expect(fetchEspia.mock.calls[0][0]).toBe(`${URL_FALSA}/usuarios/me`);
    expect(encabezados(fetchEspia.mock.calls[0]).Authorization).toBe('Bearer token-1');
  });

  it('las rutas públicas no llevan token', async () => {
    const { api, fetchEspia } = armar(async () => respuesta(200, {}));

    await api.post('/auth/google', { idToken: 'x' }, { publico: true });

    expect(encabezados(fetchEspia.mock.calls[0]).Authorization).toBeUndefined();
    expect((fetchEspia.mock.calls[0][1] as RequestInit).body).toBe('{"idToken":"x"}');
  });

  it('sin sesión no manda nada', async () => {
    const { api, fetchEspia } = armar(async () => respuesta(200, {}), { tokenAcceso: async () => null });

    await expect(api.get('/tags')).rejects.toMatchObject({ codigo: 'SESION_PERDIDA' });
    expect(fetchEspia).not.toHaveBeenCalled();
  });

  it('con 401 pide un token nuevo y repite el pedido una sola vez', async () => {
    const renovar = jest.fn(async () => 'token-2');
    const { api, fetchEspia } = armar(
      async (_url, init) =>
        (init.headers as Record<string, string>).Authorization === 'Bearer token-2'
          ? respuesta(200, { ok: true })
          : respuesta(401, { error: 'TOKEN_VENCIDO' }),
      { renovar }
    );

    expect(await api.patch('/usuarios/me', { nombre: 'Lucía' })).toEqual({ ok: true });
    expect(renovar).toHaveBeenCalledWith('token-1');
    expect(fetchEspia).toHaveBeenCalledTimes(2);
  });

  it('si el reintento también da 401, no sigue intentando', async () => {
    const { api, fetchEspia } = armar(async () => respuesta(401, { error: 'NO_AUTENTICADO' }));

    await expect(api.get('/tags')).rejects.toMatchObject({ codigo: 'NO_AUTENTICADO', estado: 401 });
    expect(fetchEspia).toHaveBeenCalledTimes(2);
  });

  it('si la sesión no se puede renovar, avisa que se perdió', async () => {
    const { api } = armar(async () => respuesta(401, { error: 'TOKEN_VENCIDO' }), { renovar: async () => null });

    await expect(api.get('/tags')).rejects.toMatchObject({ codigo: 'SESION_PERDIDA', estado: 401 });
  });

  it('traduce los errores del servidor a su código y estado', async () => {
    const { api } = armar(async () => respuesta(409, { error: 'NOMBRE_REPETIDO' }));

    const error = await api.post('/tags', {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({ codigo: 'NOMBRE_REPETIDO', estado: 409 });
  });

  it('una respuesta sin el formato esperado no rompe la app', async () => {
    const { api } = armar(async () => respuesta(502));

    await expect(api.get('/tags')).rejects.toMatchObject({ codigo: 'RESPUESTA_INESPERADA', estado: 502 });
  });

  it('204 no tiene cuerpo', async () => {
    const { api } = armar(async () => respuesta(204));

    await expect(api.post('/auth/logout', {}, { publico: true })).resolves.toBeUndefined();
  });

  it('sin red, o si el servidor tarda demasiado, es SIN_CONEXION', async () => {
    const sinRed = armar(async () => {
      throw new TypeError('Network request failed');
    });
    await expect(sinRed.api.get('/tags')).rejects.toMatchObject({ codigo: 'SIN_CONEXION', estado: null });

    const lento = armar(
      (_url, init) =>
        new Promise((_resolver, rechazar) => {
          init.signal?.addEventListener('abort', () => rechazar(new Error('abortado')));
        }),
      {},
      20
    );
    await expect(lento.api.get('/tags')).rejects.toMatchObject({ codigo: 'SIN_CONEXION' });
  });
});
