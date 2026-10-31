import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Usuario } from '@/dominio';
import { devolucion } from '@/__pruebas__/fabricas';
import { borrarBasesEnMemoria } from '@/__pruebas__/sqliteEnMemoria';
import { ID_USUARIO_DEMO } from '@/datos/demo';
import { cerrarBaseLocal } from '@/persistencia/baseLocal';
import * as DevolucionLocal from '@/persistencia/DevolucionLocalRepository';
import * as UsuarioLocal from '@/persistencia/UsuarioLocalRepository';
import { useDevolucionStore } from '../DevolucionStore';

jest.mock('expo-sqlite', () => require('@/__pruebas__/sqliteEnMemoria'));
const mockPost = jest.fn<(...args: unknown[]) => Promise<unknown>>();
jest.mock('@/servicios/conexion', () => ({ api: { post: (...args: unknown[]) => mockPost(...args) } }));

const lucia: Usuario = {
  id: 'lucia',
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
};

beforeEach(async () => {
  mockPost.mockReset();
  await UsuarioLocal.guardar(lucia);
  useDevolucionStore.getState().limpiar();
});

afterEach(async () => {
  await cerrarBaseLocal();
  borrarBasesEnMemoria();
});

describe('DevolucionStore', () => {
  it('al entrar muestra lo guardado en el teléfono, y después lo que manda el servidor', async () => {
    await DevolucionLocal.guardar('lucia', devolucion('rapida', '2026-10-28'));
    const nueva = devolucion('rapida', '2026-10-29', { titulo: 'La de hoy' });
    mockPost.mockResolvedValue({ rapida: nueva, semanal: null, cuidado: null });

    await useDevolucionStore.getState().cargar('lucia');
    expect(useDevolucionStore.getState().rapida?.hasta).toBe('2026-10-28');

    await useDevolucionStore.getState().actualizar();
    expect(useDevolucionStore.getState()).toMatchObject({ rapida: { titulo: 'La de hoy' }, pedido: 'quieto' });
    expect((await DevolucionLocal.obtener('lucia')).rapida?.titulo).toBe('La de hoy');
  });

  it('sin conexión queda lo guardado, y lo dice', async () => {
    await DevolucionLocal.guardar('lucia', devolucion('rapida', '2026-10-28'));
    mockPost.mockRejectedValue(new (require('@/api/ApiClient').ErrorApi)('SIN_CONEXION', null));
    await useDevolucionStore.getState().cargar('lucia');

    await useDevolucionStore.getState().actualizar();

    expect(useDevolucionStore.getState()).toMatchObject({ rapida: { hasta: '2026-10-28' }, pedido: 'sinConexion' });
  });

  it('dos pedidos seguidos esperan al mismo', async () => {
    mockPost.mockResolvedValue({ rapida: null, semanal: null, cuidado: null });
    await useDevolucionStore.getState().cargar('lucia');

    await Promise.all([useDevolucionStore.getState().actualizar(), useDevolucionStore.getState().actualizar()]);

    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('la cuenta demo muestra un ejemplo y nunca le pide nada al servidor', async () => {
    await useDevolucionStore.getState().cargar(ID_USUARIO_DEMO);
    await useDevolucionStore.getState().actualizar();

    expect(useDevolucionStore.getState().rapida?.titulo).toBeTruthy();
    expect(useDevolucionStore.getState().semanal?.tipo).toBe('semanal');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('al cerrar sesión no queda nada de la persona en pantalla', async () => {
    mockPost.mockResolvedValue({ rapida: devolucion('rapida', '2026-10-29'), semanal: null, cuidado: null });
    await useDevolucionStore.getState().cargar('lucia');
    await useDevolucionStore.getState().actualizar();

    useDevolucionStore.getState().limpiar();

    expect(useDevolucionStore.getState()).toMatchObject({ usuarioId: null, rapida: null, semanal: null, cuidado: null });
  });
});
