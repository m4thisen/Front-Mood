import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Usuario } from '@/dominio';
import { registro } from '@/__pruebas__/fabricas';
import { borrarBasesEnMemoria } from '@/__pruebas__/sqliteEnMemoria';
import { cerrarBaseLocal } from '../baseLocal';
import * as RegistroLocal from '../RegistroLocalRepository';
import * as UsuarioLocal from '../UsuarioLocalRepository';

jest.mock('expo-sqlite', () => require('@/__pruebas__/sqliteEnMemoria'));

const usuario = (id: string, extra: Partial<Usuario> = {}): Usuario => ({
  id,
  nombre: 'Lucía',
  fechaNacimiento: '2002-05-14',
  genero: 'FEMENINO',
  idioma: 'es',
  horaRecordatorio: '21:00',
  frecuenciaIA: 1,
  zonaHoraria: 'America/Argentina/Buenos_Aires',
  bloquesActivos: ['estudios', 'gente'],
  onboardingCompleto: true,
  ...extra,
});

const ID = 'usuario-prueba';

beforeEach(async () => {
  await UsuarioLocal.guardar(usuario(ID));
});

afterEach(async () => {
  await cerrarBaseLocal();
  borrarBasesEnMemoria();
});

describe('RegistroLocalRepository', () => {
  it('guarda y devuelve el registro completo, tal cual', async () => {
    const completo = registro('2026-10-10', 4, {
      destacado: true,
      texto: 'Aprobé el final',
      horasSueno: 7.5,
      minutosEjercicio: 45,
      climas: ['SOLEADO', 'FRIO'],
      etiquetas: ['estudios.aprobe', 'gente.saliConAmigos'],
      valoresTags: { 'tag-1': true, 'tag-2': 'lo hablé con mamá' },
      cancion: { spotifyId: 'abc123', titulo: 'Zamba de mi esperanza', artista: 'Jorge Cafrune', portadaUrl: null },
    });

    await RegistroLocal.guardar(completo);

    expect(await RegistroLocal.obtenerPorFecha(ID, '2026-10-10')).toEqual(completo);
  });

  it('editar reemplaza etiquetas y climas, y no cambia la hora de carga (RF-15)', async () => {
    const original = registro('2026-10-10', 2, { climas: ['LLUVIA'], etiquetas: ['estudios.examen'] });
    await RegistroLocal.guardar(original);

    await RegistroLocal.guardar({
      ...original,
      nivelAnimo: 4,
      climas: ['SOLEADO'],
      etiquetas: [],
      horaCarga: '2026-10-10T23:59:00.000-03:00',
      actualizadoEn: '2026-10-10T22:30:00.000-03:00',
    });

    expect(await RegistroLocal.obtenerPorFecha(ID, '2026-10-10')).toMatchObject({
      nivelAnimo: 4,
      climas: ['SOLEADO'],
      etiquetas: [],
      horaCarga: original.horaCarga,
      actualizadoEn: '2026-10-10T22:30:00.000-03:00',
    });
  });

  it('RN-01: no puede haber dos registros para la misma fecha', async () => {
    await RegistroLocal.guardar(registro('2026-10-10'));

    await expect(RegistroLocal.guardar(registro('2026-10-10', 3, { id: 'otro-id' }))).rejects.toThrow(/UNIQUE/);
    expect(await RegistroLocal.obtenerTodos(ID)).toHaveLength(1);
  });

  it('el rango incluye los extremos y viene ordenado por fecha', async () => {
    for (const fecha of ['2026-10-12', '2026-10-01', '2026-10-10', '2026-09-30', '2026-10-31']) {
      await RegistroLocal.guardar(registro(fecha));
    }

    const octubre = await RegistroLocal.obtenerRango(ID, '2026-10-01', '2026-10-31');

    expect(octubre.map((r) => r.fecha)).toEqual(['2026-10-01', '2026-10-10', '2026-10-12', '2026-10-31']);
  });

  it('los registros de otra persona en el mismo teléfono no se ven ni se pisan', async () => {
    await UsuarioLocal.guardar(usuario('otra'));
    await RegistroLocal.guardar(registro('2026-10-10', 5, { usuarioId: 'otra', id: 'de-otra' }));
    await RegistroLocal.guardar(registro('2026-10-10', 1));

    expect(await RegistroLocal.obtenerTodos(ID)).toMatchObject([{ nivelAnimo: 1 }]);
    await expect(RegistroLocal.guardar(registro('2026-10-11', 2, { id: 'de-otra' }))).rejects.toThrow();
    expect(await RegistroLocal.obtenerTodos('otra')).toMatchObject([{ id: 'de-otra', nivelAnimo: 5 }]);
  });

  it('pendientes de sincronizar y marcado como sincronizados', async () => {
    await RegistroLocal.guardar(registro('2026-10-09'));
    await RegistroLocal.guardar(registro('2026-10-10'));

    await RegistroLocal.marcarSincronizados(ID, [registro('2026-10-09')]);

    expect((await RegistroLocal.obtenerPendientes(ID)).map((r) => r.fecha)).toEqual(['2026-10-10']);
    expect(await RegistroLocal.obtenerPorFecha(ID, '2026-10-09')).toMatchObject({ sincronizado: true });
  });
});

describe('UsuarioLocalRepository', () => {
  it('guarda y actualiza el perfil', async () => {
    await UsuarioLocal.guardar(usuario(ID, { idioma: 'en', frecuenciaIA: 7, bloquesActivos: [] }));

    expect(await UsuarioLocal.obtener(ID)).toEqual(usuario(ID, { idioma: 'en', frecuenciaIA: 7, bloquesActivos: [] }));
    expect(await UsuarioLocal.obtener('nadie')).toBeNull();
  });

  it('la sesión activa se guarda y se borra', async () => {
    expect(await UsuarioLocal.obtenerSesionActiva()).toBeNull();

    await UsuarioLocal.guardarSesionActiva(ID);
    expect(await UsuarioLocal.obtenerSesionActiva()).toBe(ID);

    await UsuarioLocal.guardarSesionActiva(null);
    expect(await UsuarioLocal.obtenerSesionActiva()).toBeNull();
  });

  it('los tags vuelven en el orden en que se crearon, y guardar reemplaza la lista', async () => {
    const tags = [
      { id: 't-2', nombre: 'Terapia', tipo: 'SI_NO' as const, activo: true },
      { id: 't-1', nombre: 'Guitarra', tipo: 'TEXTO' as const, activo: false },
    ];
    await UsuarioLocal.guardarTags(ID, tags);
    expect(await UsuarioLocal.obtenerTags(ID)).toEqual(tags);

    await UsuarioLocal.guardarTags(ID, [tags[1]]);
    expect(await UsuarioLocal.obtenerTags(ID)).toEqual([tags[1]]);
  });

  it('los cambios pendientes de enviar arrancan vacíos y se guardan', async () => {
    expect(await UsuarioLocal.obtenerPendientes(ID)).toEqual({ perfil: 0, tags: {} });

    await UsuarioLocal.guardarPendientes(ID, { perfil: 2, tags: { 't-1': 1 } });

    expect(await UsuarioLocal.obtenerPendientes(ID)).toEqual({ perfil: 2, tags: { 't-1': 1 } });
  });
});
