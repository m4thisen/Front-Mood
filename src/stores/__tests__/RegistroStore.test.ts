import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { subDays } from 'date-fns';
import { DatosRegistro } from '@/dominio';
import { borrarBasesEnMemoria } from '@/__pruebas__/sqliteEnMemoria';
import { cerrarBaseLocal } from '@/persistencia/baseLocal';
import * as RegistroLocal from '@/persistencia/RegistroLocalRepository';
import * as UsuarioLocal from '@/persistencia/UsuarioLocalRepository';
import { todayISO, toISODate } from '@/utils/fecha';
import { useRegistroStore } from '../RegistroStore';

jest.mock('expo-sqlite', () => require('@/__pruebas__/sqliteEnMemoria'));
jest.mock('expo-crypto', () => ({ randomUUID: () => require('crypto').randomUUID() }));
// Sin servidor: la sincronización se prueba aparte (SyncService.test).
jest.mock('@/servicios/conexion', () => ({
  api: { post: () => Promise.reject(new (require('@/api/ApiClient').ErrorApi)('SESION_PERDIDA', 401)) },
}));

const ID = 'usuario-prueba';

const datos = (extra: Partial<DatosRegistro> = {}): DatosRegistro => ({
  nivelAnimo: 4,
  destacado: false,
  texto: '',
  horasSueno: null,
  minutosEjercicio: null,
  climas: [],
  etiquetas: [],
  valoresTags: {},
  cancion: null,
  ...extra,
});

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
  await useRegistroStore.getState().cargar(ID);
});

afterEach(async () => {
  useRegistroStore.getState().limpiar();
  await cerrarBaseLocal();
  borrarBasesEnMemoria();
});

describe('RegistroStore · registrar día (CU-09)', () => {
  it('guarda en la base local, queda pendiente de sincronizar y se ve enseguida', async () => {
    const errores = await useRegistroStore.getState().guardar(datos({ climas: ['SOLEADO'] }));

    expect(errores).toEqual([]);
    const enBase = await RegistroLocal.obtenerPorFecha(ID, todayISO());
    expect(enBase).toMatchObject({ nivelAnimo: 4, climas: ['SOLEADO'], sincronizado: false });
    expect(useRegistroStore.getState().registros[todayISO()]).toEqual(enBase);
  });

  it('E1: sin ánimo no se guarda nada', async () => {
    const errores = await useRegistroStore.getState().guardar(datos({ nivelAnimo: null }));

    expect(errores).toEqual(['ANIMO_REQUERIDO']);
    expect(await RegistroLocal.obtenerTodos(ID)).toEqual([]);
  });

  it('E2: un valor fuera de rango no se guarda', async () => {
    const errores = await useRegistroStore.getState().guardar(datos({ horasSueno: 25 }));

    expect(errores).toEqual(['HORAS_SUENO_FUERA_DE_RANGO']);
    expect(await RegistroLocal.obtenerTodos(ID)).toEqual([]);
  });

  it('E3: si la base local falla, el error llega a la pantalla y no cambia nada en memoria', async () => {
    const falla = jest.spyOn(RegistroLocal, 'guardar').mockRejectedValueOnce(new Error('database or disk is full'));

    await expect(useRegistroStore.getState().guardar(datos())).rejects.toThrow('disk is full');

    expect(useRegistroStore.getState().registros[todayISO()]).toBeUndefined();
    falla.mockRestore();
  });
});

describe('RegistroStore · editar el día (CU-11)', () => {
  it('si ya existe el registro de hoy, lo edita: mismo id y misma hora de carga (RF-15)', async () => {
    await useRegistroStore.getState().guardar(datos({ nivelAnimo: 2 }));
    const original = useRegistroStore.getState().registros[todayISO()];

    await useRegistroStore.getState().guardar(datos({ nivelAnimo: 5, texto: 'Mejoró a la noche' }));

    const editado = await RegistroLocal.obtenerPorFecha(ID, todayISO());
    expect(editado).toMatchObject({ id: original.id, horaCarga: original.horaCarga, nivelAnimo: 5 });
    expect(await RegistroLocal.obtenerTodos(ID)).toHaveLength(1);
  });

  it('RN-03: un formulario abierto ayer no guarda hoy (pasó la medianoche)', async () => {
    const ayer = toISODate(subDays(new Date(), 1));

    const errores = await useRegistroStore.getState().guardar(datos(), ayer);

    expect(errores).toEqual(['DIA_TERMINADO']);
    expect(await RegistroLocal.obtenerTodos(ID)).toEqual([]);
  });
});
