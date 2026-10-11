import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ApiClient } from '@/api/ApiClient';
import { aRegistroApi } from '@/api/registros';
import { registro } from '@/__pruebas__/fabricas';
import { ServidorFalso, URL_FALSA } from '@/__pruebas__/servidorFalso';
import { borrarBasesEnMemoria } from '@/__pruebas__/sqliteEnMemoria';
import { cerrarBaseLocal } from '@/persistencia/baseLocal';
import * as RegistroLocal from '@/persistencia/RegistroLocalRepository';
import * as UsuarioLocal from '@/persistencia/UsuarioLocalRepository';
import { REGISTROS_POR_TANDA, SyncService } from '../SyncService';

jest.mock('expo-sqlite', () => require('@/__pruebas__/sqliteEnMemoria'));

const ID = 'usuario-prueba';
const dia = (n: number) => `2026-0${1 + Math.floor((n - 1) / 28)}-${String(((n - 1) % 28) + 1).padStart(2, '0')}`;

let servidor: ServidorFalso;
let sesionDe: string;
let sync: SyncService;

beforeEach(async () => {
  await UsuarioLocal.guardar({
    id: ID,
    nombre: 'Lucía',
    fechaNacimiento: '2002-05-14',
    genero: 'FEMENINO',
    idioma: 'es',
    horaRecordatorio: '21:00',
    frecuenciaIA: 1,
    zonaHoraria: 'America/Argentina/Buenos_Aires',
    bloquesActivos: [],
    onboardingCompleto: true,
  });
  servidor = new ServidorFalso();
  sesionDe = ID;
  const { accessToken } = servidor.abrirSesion();
  const api = new ApiClient(URL_FALSA, { tokenAcceso: async () => accessToken, renovar: async () => null }, servidor.fetch);
  sync = new SyncService(api, RegistroLocal, (id) => id === sesionDe);
});

afterEach(async () => {
  sync.detener();
  jest.restoreAllMocks();
  await cerrarBaseLocal();
  borrarBasesEnMemoria();
});

const pedidosSync = () => servidor.pedidosA('/sync');

describe('SyncService · CU-12', () => {
  it('sube lo pendiente, lo marca sincronizado y baja lo de otro teléfono', async () => {
    await RegistroLocal.guardar(registro('2026-10-10', 4));
    servidor.guardarRegistro(aRegistroApi(registro('2026-10-09', 2, { id: 'de-otro-telefono' })));

    const resultado = await sync.sincronizar(ID);

    expect(resultado).toEqual({ enviados: 1, recibidos: 1, rechazados: 0 });
    expect(await RegistroLocal.obtenerPendientes(ID)).toEqual([]);
    expect(await RegistroLocal.obtenerPorFecha(ID, '2026-10-09')).toMatchObject({ id: 'de-otro-telefono', sincronizado: true });
    expect(servidor.registros.has('id-2026-10-10')).toBe(true);
    expect(await RegistroLocal.obtenerCursor(ID)).not.toBeNull();
  });

  it('manda los pendientes en tandas', async () => {
    for (let n = 1; n <= 60; n += 1) await RegistroLocal.guardar(registro(dia(n)));

    await sync.sincronizar(ID);

    expect(pedidosSync().map((p) => (p.cuerpo!.registros as unknown[]).length)).toEqual([
      REGISTROS_POR_TANDA,
      REGISTROS_POR_TANDA,
      60 - 2 * REGISTROS_POR_TANDA,
    ]);
    expect(await RegistroLocal.obtenerPendientes(ID)).toEqual([]);
  });

  it('CU-02, paso 8: en un teléfono nuevo baja todo el historial, por partes', async () => {
    servidor.cambiosPorPagina = 10;
    for (let n = 1; n <= 23; n += 1) servidor.guardarRegistro(aRegistroApi(registro(dia(n))));

    const resultado = await sync.sincronizar(ID);

    expect(resultado?.recibidos).toBe(23);
    expect(await RegistroLocal.obtenerTodos(ID)).toHaveLength(23);
    expect(pedidosSync()).toHaveLength(3);
  });

  it('lo que se editó mientras viajaba queda pendiente y se manda en la vuelta siguiente', async () => {
    const original = registro('2026-10-10', 2, { actualizadoEn: '2026-10-10T21:00:00.000Z' });
    await RegistroLocal.guardar(original);
    const soltar = servidor.frenarPedidos();

    const enCurso = sync.sincronizar(ID);
    while (pedidosSync().length === 0) await new Promise((r) => setTimeout(r, 1));
    await RegistroLocal.guardar({ ...original, nivelAnimo: 5, actualizadoEn: '2026-10-10T21:05:00.000Z' });
    void sync.sincronizar(ID); // pide otra vuelta
    soltar();
    await enCurso;

    expect(await RegistroLocal.obtenerPendientes(ID)).toEqual([]);
    expect(servidor.registros.get(original.id)?.registro.nivelAnimo).toBe(5);
  });

  it('E3: un registro rechazado no se reintenta para siempre', async () => {
    const malo = registro('2026-10-10');
    await RegistroLocal.guardar(malo);
    servidor.rechazarIds.add(malo.id);

    expect(await sync.sincronizar(ID)).toMatchObject({ rechazados: 1 });
    await sync.sincronizar(ID);

    expect((pedidosSync()[1].cuerpo!.registros as unknown[]).length).toBe(0);
  });

  it('E1: sin conexión no se pierde nada y se reintenta con espera creciente', async () => {
    await RegistroLocal.guardar(registro('2026-10-10'));
    servidor.sinConexion = true;
    const temporizadores = jest.spyOn(global, 'setTimeout');

    expect(await sync.sincronizar(ID)).toBeNull();
    expect(await RegistroLocal.obtenerPendientes(ID)).toHaveLength(1);
    const reintento = temporizadores.mock.calls.find(([, ms]) => ms === 30_000);
    expect(reintento).toBeDefined();

    // Vuelve la señal y se cumple el plazo.
    servidor.sinConexion = false;
    (reintento![0] as () => void)();
    await sync.sincronizar(ID);
    expect(await RegistroLocal.obtenerPendientes(ID)).toEqual([]);
  });

  it('nunca sincroniza con la sesión de otra persona', async () => {
    await RegistroLocal.guardar(registro('2026-10-10'));
    sesionDe = 'otra-persona';

    await sync.sincronizar(ID);

    expect(pedidosSync()).toHaveLength(0);
    expect(await RegistroLocal.obtenerPendientes(ID)).toHaveLength(1);
  });
});
