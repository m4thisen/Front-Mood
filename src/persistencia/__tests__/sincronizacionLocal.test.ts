import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { registro } from '@/__pruebas__/fabricas';
import { borrarBasesEnMemoria } from '@/__pruebas__/sqliteEnMemoria';
import { cerrarBaseLocal } from '../baseLocal';
import * as RegistroLocal from '../RegistroLocalRepository';
import * as UsuarioLocal from '../UsuarioLocalRepository';

jest.mock('expo-sqlite', () => require('@/__pruebas__/sqliteEnMemoria'));

const ID = 'usuario-prueba';
const a_las = (hora: string) => `2026-10-10T${hora}:00.000Z`;

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
    analisisTexto: false,
  });
});

afterEach(async () => {
  await cerrarBaseLocal();
  borrarBasesEnMemoria();
});

describe('lo que llega del servidor (CU-12, paso 9)', () => {
  it('un registro nuevo se incorpora ya sincronizado', async () => {
    await RegistroLocal.aplicarDelServidor(ID, [registro('2026-10-09', 4, { sincronizado: false })]);

    expect(await RegistroLocal.obtenerPorFecha(ID, '2026-10-09')).toMatchObject({ nivelAnimo: 4, sincronizado: true });
    expect(await RegistroLocal.obtenerPendientes(ID)).toEqual([]);
  });

  it('última edición gana: un pendiente local más nuevo no se pisa', async () => {
    await RegistroLocal.guardar(registro('2026-10-10', 5, { actualizadoEn: a_las('22:00') }));

    await RegistroLocal.aplicarDelServidor(ID, [registro('2026-10-10', 1, { actualizadoEn: a_las('21:00') })]);

    expect(await RegistroLocal.obtenerPorFecha(ID, '2026-10-10')).toMatchObject({ nivelAnimo: 5, sincronizado: false });
  });

  it('última edición gana: un pendiente local más viejo se reemplaza por el del servidor', async () => {
    await RegistroLocal.guardar(registro('2026-10-10', 1, { actualizadoEn: a_las('20:00') }));

    await RegistroLocal.aplicarDelServidor(ID, [registro('2026-10-10', 5, { actualizadoEn: a_las('22:00') })]);

    expect(await RegistroLocal.obtenerPorFecha(ID, '2026-10-10')).toMatchObject({ nivelAnimo: 5, sincronizado: true });
  });

  it('si el servidor unificó el día con otro id, el registro local se reemplaza (RN-01)', async () => {
    await RegistroLocal.guardar(registro('2026-10-10', 2, { id: 'id-de-este-telefono', sincronizado: true }));

    await RegistroLocal.aplicarDelServidor(ID, [
      registro('2026-10-10', 4, { id: 'id-del-servidor', etiquetas: ['gente.enFamilia'], climas: ['LLUVIA'] }),
    ]);

    expect(await RegistroLocal.obtenerTodos(ID)).toMatchObject([
      { id: 'id-del-servidor', nivelAnimo: 4, etiquetas: ['gente.enFamilia'], climas: ['LLUVIA'] },
    ]);
  });
});

describe('marcas de sincronización', () => {
  it('solo se marca lo que no se editó mientras viajaba', async () => {
    const enviado = registro('2026-10-10', 3, { actualizadoEn: a_las('21:00') });
    await RegistroLocal.guardar(enviado);
    // Se editó después de mandarlo.
    await RegistroLocal.guardar({ ...enviado, nivelAnimo: 5, actualizadoEn: a_las('21:05') });

    await RegistroLocal.marcarSincronizados(ID, [enviado]);

    expect(await RegistroLocal.obtenerPendientes(ID)).toMatchObject([{ nivelAnimo: 5 }]);
  });

  it('E3: un rechazado deja de reintentarse, y vuelve a pendiente si el usuario lo edita', async () => {
    const malo = registro('2026-10-10');
    await RegistroLocal.guardar(malo);

    await RegistroLocal.marcarRechazados(ID, [malo.id]);
    expect(await RegistroLocal.obtenerPendientes(ID)).toEqual([]);

    await RegistroLocal.guardar({ ...malo, nivelAnimo: 2, actualizadoEn: a_las('23:00') });
    expect(await RegistroLocal.obtenerPendientes(ID)).toMatchObject([{ id: malo.id, nivelAnimo: 2 }]);
  });

  it('el cursor arranca vacío y se guarda por usuario', async () => {
    expect(await RegistroLocal.obtenerCursor(ID)).toBeNull();

    await RegistroLocal.guardarCursor(ID, '2026-10-10T22:00:00.000Z|un-id');

    expect(await RegistroLocal.obtenerCursor(ID)).toBe('2026-10-10T22:00:00.000Z|un-id');
  });
});
