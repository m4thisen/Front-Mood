import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ApiClient } from '@/api/ApiClient';
import { AlmacenSeguro } from '@/persistencia/AlmacenSeguro';
import {
  esperarPedidosPendientes,
  LlaveroEnMemoria,
  ServidorFalso,
  URL_FALSA,
} from '@/__pruebas__/servidorFalso';
import { AuthService, ProveedorIdentidad } from '../AuthService';

const ID_TOKEN = 'simulado:lucia:lucia@ejemplo.com';

let servidor: ServidorFalso;
let llavero: LlaveroEnMemoria;
let almacen: AlmacenSeguro;
let identidad: ProveedorIdentidad;
let auth: AuthService;
let api: ApiClient;

beforeEach(() => {
  servidor = new ServidorFalso();
  llavero = new LlaveroEnMemoria();
  almacen = new AlmacenSeguro(llavero);
  identidad = { obtenerIdToken: async () => ID_TOKEN };
  api = new ApiClient(
    URL_FALSA,
    { tokenAcceso: () => auth.tokenAcceso(), renovar: (t) => auth.renovar(t) },
    servidor.fetch
  );
  auth = new AuthService(api, almacen, identidad, () => 'America/Argentina/Buenos_Aires');
});

describe('AuthService · entrar (CU-01, CU-02)', () => {
  it('manda el idToken con el idioma y la zona horaria, y guarda los tokens en el llavero', async () => {
    const resultado = await auth.ingresarConGoogle('es');

    expect(resultado).toEqual({ esNuevo: true });
    expect(servidor.pedidosA('/auth/google')[0].cuerpo).toEqual({
      idToken: ID_TOKEN,
      idioma: 'es',
      zonaHoraria: 'America/Argentina/Buenos_Aires',
    });
    expect(await almacen.leerTokens()).toEqual({ accessToken: 'acceso-1', refreshToken: 'refresco-1' });
    expect(await auth.haySesion()).toBe(true);
  });

  it('si la persona cancela, no se llama al servidor', async () => {
    identidad.obtenerIdToken = async () => null;

    expect(await auth.ingresarConGoogle('es')).toBeNull();
    expect(servidor.pedidos).toHaveLength(0);
    expect(await auth.haySesion()).toBe(false);
  });
});

describe('AuthService · renovar la sesión', () => {
  beforeEach(async () => {
    await auth.ingresarConGoogle('es');
    servidor.vencerAccesos();
  });

  it('cinco pedidos con el token vencido hacen una sola renovación (si no, el servidor lo vería como robo)', async () => {
    const respuestas = await Promise.all(Array.from({ length: 5 }, (_, i) => api.get(`/dato/${i}`)));

    expect(respuestas).toHaveLength(5);
    expect(servidor.pedidosA('/auth/refresh')).toHaveLength(1);
    expect(servidor.reusoDetectado).toBe(false);
    expect(await almacen.leerTokens()).toEqual({ accessToken: 'acceso-2', refreshToken: 'refresco-2' });
  });

  it('pedidos seguidos con el token vencido: el segundo usa el token que ya renovó el primero', async () => {
    await api.get('/uno');
    await api.get('/dos');

    expect(servidor.pedidosA('/auth/refresh')).toHaveLength(1);
    expect(servidor.pedidosA('/dos')[0].autorizacion).toBe('Bearer acceso-2');
  });

  it('si el servidor da la sesión por terminada, borra los tokens y avisa', async () => {
    const aviso = jest.fn();
    auth.alPerderSesion(aviso);
    servidor.revocarTodo();

    await expect(api.get('/dato')).rejects.toMatchObject({ codigo: 'SESION_PERDIDA' });
    expect(await auth.haySesion()).toBe(false);
    expect(aviso).toHaveBeenCalledTimes(1);
  });

  it('sin conexión, la sesión queda como estaba para reintentar después', async () => {
    const aviso = jest.fn();
    auth.alPerderSesion(aviso);
    servidor.sinConexion = true;

    await expect(api.get('/dato')).rejects.toMatchObject({ codigo: 'SIN_CONEXION' });
    expect(await almacen.leerTokens()).toEqual({ accessToken: 'acceso-1', refreshToken: 'refresco-1' });
    expect(aviso).not.toHaveBeenCalled();
  });
});

describe('AuthService · cerrar sesión (CU-03)', () => {
  beforeEach(async () => {
    await auth.ingresarConGoogle('es');
  });

  it('borra los tokens del dispositivo y cierra la sesión en el servidor', async () => {
    await auth.cerrarSesion();

    expect(llavero.datos.size).toBe(0);
    await esperarPedidosPendientes();
    expect(servidor.pedidosA('/auth/logout')[0].cuerpo).toEqual({ refreshToken: 'refresco-1' });
    expect(servidor.sesionesAbiertas()).toBe(0);
  });

  it('sin conexión, igual borra los tokens del dispositivo', async () => {
    servidor.sinConexion = true;

    await auth.cerrarSesion();

    expect(llavero.datos.size).toBe(0);
  });

  it('si hay una renovación en vuelo, la espera y cierra con el token nuevo', async () => {
    servidor.vencerAccesos();
    const soltar = servidor.frenarRenovaciones();
    const pedido = api.get('/dato');
    while (servidor.pedidosA('/auth/refresh').length === 0) await new Promise((r) => setTimeout(r, 1));

    const cierre = auth.cerrarSesion();
    soltar();
    await Promise.all([pedido, cierre]);
    await esperarPedidosPendientes();

    // Con el token viejo, el servidor lo habría tomado como reuso.
    expect(servidor.pedidosA('/auth/logout')[0].cuerpo).toEqual({ refreshToken: 'refresco-2' });
    expect(servidor.reusoDetectado).toBe(false);
    expect(servidor.sesionesAbiertas()).toBe(0);
    expect(llavero.datos.size).toBe(0);
  });

  it('un pedido que vence mientras se cierra la sesión no renueva', async () => {
    servidor.vencerAccesos();

    const [resultado] = await Promise.allSettled([api.get('/dato'), auth.cerrarSesion()]);
    await esperarPedidosPendientes();

    expect(resultado).toMatchObject({ status: 'rejected', reason: { codigo: 'SESION_PERDIDA' } });
    expect(servidor.pedidosA('/auth/refresh')).toHaveLength(0);
    expect(servidor.reusoDetectado).toBe(false);
  });
});
