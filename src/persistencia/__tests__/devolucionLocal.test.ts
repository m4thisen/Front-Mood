import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Usuario } from '@/dominio';
import { devolucion } from '@/__pruebas__/fabricas';
import { borrarBasesEnMemoria } from '@/__pruebas__/sqliteEnMemoria';
import { baseLocal, cerrarBaseLocal } from '../baseLocal';
import * as DevolucionLocal from '../DevolucionLocalRepository';
import * as UsuarioLocal from '../UsuarioLocalRepository';

jest.mock('expo-sqlite', () => require('@/__pruebas__/sqliteEnMemoria'));

const usuario = (id: string): Usuario => ({
  id,
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

beforeEach(async () => {
  await UsuarioLocal.guardar(usuario('lucia'));
  await UsuarioLocal.guardar(usuario('martina'));
});

afterEach(async () => {
  await cerrarBaseLocal();
  borrarBasesEnMemoria();
});

describe('DevolucionLocalRepository', () => {
  it('guarda la última de cada tipo, tal cual llegó, y solo para esa persona', async () => {
    const rapida = devolucion('rapida', '2026-10-29');
    await DevolucionLocal.guardar('lucia', rapida);

    expect(await DevolucionLocal.obtener('lucia')).toEqual({ rapida, semanal: null });
    expect(await DevolucionLocal.obtener('martina')).toEqual({ rapida: null, semanal: null });
  });

  it('una nueva del mismo tipo reemplaza a la anterior', async () => {
    await DevolucionLocal.guardar('lucia', devolucion('rapida', '2026-10-28'));
    const nueva = devolucion('rapida', '2026-10-29', { titulo: 'La de hoy' });
    const semanal = devolucion('semanal', '2026-10-25');

    await DevolucionLocal.guardar('lucia', nueva);
    await DevolucionLocal.guardar('lucia', semanal);

    expect(await DevolucionLocal.obtener('lucia')).toEqual({ rapida: nueva, semanal });
  });

  it('una copia rota no rompe nada: queda como si no hubiera', async () => {
    const base = await baseLocal();
    await base.ejecutar("INSERT INTO devolucion_local (usuario_id, tipo, datos) VALUES ('lucia', 'rapida', '{roto')");

    expect(await DevolucionLocal.obtener('lucia')).toEqual({ rapida: null, semanal: null });
  });
});
