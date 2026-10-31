/**
 * La última devolución de cada tipo, guardada en el dispositivo: "Cómo venís"
 * se ve aunque no haya conexión (offline-first). El mensaje de cuidado no se
 * guarda: es solo del día en que se pidió.
 */
import { Devolucion, TipoDevolucion } from '@/dominio';
import { baseLocal } from './baseLocal';

export async function guardar(usuarioId: string, devolucion: Devolucion): Promise<void> {
  const base = await baseLocal();
  await base.ejecutar(
    `INSERT INTO devolucion_local (usuario_id, tipo, datos) VALUES (?, ?, ?)
     ON CONFLICT (usuario_id, tipo) DO UPDATE SET datos = excluded.datos`,
    [usuarioId, devolucion.tipo, JSON.stringify(devolucion)]
  );
}

export async function obtener(usuarioId: string): Promise<Record<TipoDevolucion, Devolucion | null>> {
  const base = await baseLocal();
  const filas = await base.todas<{ tipo: TipoDevolucion; datos: string }>(
    'SELECT tipo, datos FROM devolucion_local WHERE usuario_id = ?',
    [usuarioId]
  );
  const guardadas: Record<TipoDevolucion, Devolucion | null> = { rapida: null, semanal: null };
  for (const fila of filas) {
    try {
      guardadas[fila.tipo] = JSON.parse(fila.datos) as Devolucion;
    } catch {
      // Una copia rota no impide nada: se reemplaza con la próxima.
    }
  }
  return guardadas;
}
