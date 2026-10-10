import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { borrarBasesEnMemoria } from '@/__pruebas__/sqliteEnMemoria';
import { baseLocal, cerrarBaseLocal, MIGRACIONES } from '../baseLocal';

jest.mock('expo-sqlite', () => require('@/__pruebas__/sqliteEnMemoria'));

afterEach(async () => {
  await cerrarBaseLocal();
  borrarBasesEnMemoria();
});

const USUARIO = `INSERT INTO usuario (id, nombre, fecha_nacimiento, genero, idioma, hora_recordatorio, frecuencia_ia, zona_horaria)
  VALUES ('u-1', 'Lucía', '2002-05-14', 'FEMENINO', 'es', '21:00', 1, 'America/Argentina/Buenos_Aires')`;
const REGISTRO = (id: string, fecha: string, animo = 3) =>
  `INSERT INTO registro_diario (id, usuario_id, fecha, nivel_animo, hora_carga, actualizado_en)
   VALUES ('${id}', 'u-1', '${fecha}', ${animo}, '${fecha}T21:00:00Z', '${fecha}T21:00:00Z')`;

describe('baseLocal', () => {
  it('aplica todas las migraciones y deja anotada la versión', async () => {
    const base = await baseLocal();

    const fila = await base.primera<{ user_version: number }>('PRAGMA user_version');
    expect(fila?.user_version).toBe(MIGRACIONES.length);
  });

  it('al volver a abrir no repite las migraciones y conserva los datos', async () => {
    const base = await baseLocal();
    await base.ejecutar(USUARIO);
    await cerrarBaseLocal();

    const otraVez = await baseLocal();

    expect(await otraVez.primera('SELECT id FROM usuario')).toEqual({ id: 'u-1' });
  });

  it('la base repite las reglas del dominio', async () => {
    const base = await baseLocal();
    await base.ejecutar(USUARIO);
    await base.ejecutar(REGISTRO('r-1', '2026-10-10'));

    // RN-01: un único registro por fecha.
    await expect(base.ejecutar(REGISTRO('r-2', '2026-10-10'))).rejects.toThrow(/UNIQUE/);
    // RN-02: el ánimo va de 1 a 5.
    await expect(base.ejecutar(REGISTRO('r-3', '2026-10-11', 6))).rejects.toThrow(/CHECK/);
    // CU-09 E2: valores fuera de rango.
    await expect(base.ejecutar("UPDATE registro_diario SET horas_sueno = 25 WHERE id = 'r-1'")).rejects.toThrow(/CHECK/);
    // RN-06: solo climas conocidos.
    await expect(base.ejecutar("INSERT INTO registro_clima VALUES ('r-1', 'NIEVE')")).rejects.toThrow(/CHECK/);
    // Nada suelto: un registro siempre es de un usuario que existe.
    await expect(
      base.ejecutar(
        "INSERT INTO registro_diario (id, usuario_id, fecha, nivel_animo, hora_carga, actualizado_en) VALUES ('r-4', 'nadie', '2026-10-12', 3, 'x', 'x')"
      )
    ).rejects.toThrow(/FOREIGN KEY/);
  });

  it('una transacción que falla no deja nada a medias', async () => {
    const base = await baseLocal();
    await base.ejecutar(USUARIO);

    await expect(
      base.transaccion(async (tx) => {
        await tx.ejecutar(REGISTRO('r-1', '2026-10-10'));
        await tx.ejecutar(REGISTRO('r-2', '2026-10-10')); // choca con RN-01
      })
    ).rejects.toThrow();

    expect(await base.todas('SELECT id FROM registro_diario')).toEqual([]);
  });

  it('lo que llega mientras corre una transacción espera su turno y no se deshace con ella', async () => {
    const base = await baseLocal();
    await base.ejecutar(USUARIO);

    const fallida = base.transaccion(async (tx) => {
      await tx.ejecutar(REGISTRO('r-1', '2026-10-10'));
      await new Promise((r) => setTimeout(r, 10));
      throw new Error('falla a mitad de camino');
    });
    const afuera = base.ejecutar(REGISTRO('r-2', '2026-10-11'));

    await expect(fallida).rejects.toThrow('falla a mitad de camino');
    await afuera;
    expect(await base.todas('SELECT id FROM registro_diario')).toEqual([{ id: 'r-2' }]);
  });
});
