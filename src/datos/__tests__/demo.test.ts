import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { subDays } from 'date-fns';
import { registro } from '@/__pruebas__/fabricas';
import { borrarBasesEnMemoria } from '@/__pruebas__/sqliteEnMemoria';
import { cerrarBaseLocal } from '@/persistencia/baseLocal';
import * as RegistroLocal from '@/persistencia/RegistroLocalRepository';
import { toISODate } from '@/utils/fecha';
import { cargarCuentaDemo, ID_USUARIO_DEMO } from '../demo';

jest.mock('expo-sqlite', () => require('@/__pruebas__/sqliteEnMemoria'));

afterEach(async () => {
  await cerrarBaseLocal();
  borrarBasesEnMemoria();
});

describe('cuenta demo (solo desarrollo)', () => {
  it('carga semanas de historial y se puede volver a cargar sin duplicar ni pisar', async () => {
    await cargarCuentaDemo('es');
    const primera = await RegistroLocal.obtenerTodos(ID_USUARIO_DEMO);
    expect(primera.length).toBeGreaterThan(40);

    // Un día cargado a mano en la demo no se pisa al recargarla.
    const ayer = toISODate(subDays(new Date(), 1));
    const original = primera.find((r) => r.fecha === ayer)!;
    await RegistroLocal.guardar({ ...original, nivelAnimo: 1, texto: 'cargado a mano' });

    await cargarCuentaDemo('es');

    const segunda = await RegistroLocal.obtenerTodos(ID_USUARIO_DEMO);
    expect(segunda).toHaveLength(primera.length);
    expect(segunda.find((r) => r.fecha === ayer)).toMatchObject({ nivelAnimo: 1, texto: 'cargado a mano' });
  });

  it('no choca con un registro de hoy hecho en la demo', async () => {
    await cargarCuentaDemo('es');
    await RegistroLocal.guardar(registro(toISODate(new Date()), 5, { usuarioId: ID_USUARIO_DEMO, id: 'hecho-hoy' }));

    await expect(cargarCuentaDemo('es')).resolves.toBe(ID_USUARIO_DEMO);
  });
});
