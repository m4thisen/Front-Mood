/**
 * RegistroLocalRepository — «persistencia» en el diagrama de clases de la
 * aplicación móvil. Es la base de trabajo y la fuente de verdad de lo que el
 * usuario escribió.
 *
 * Implementación provisoria sobre AsyncStorage. En la iteración 2 pasa a
 * SQLite (que permite consultar por rango sin cargar todo en memoria)
 * manteniendo estas mismas funciones.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegistroDiario } from '@/dominio';
import { CLAVES } from './claves';

type RegistrosPorFecha = Record<string, RegistroDiario>;

/** Inserta o reemplaza el registro de su fecha (RN-01: uno por fecha). */
export async function guardar(registro: RegistroDiario): Promise<void> {
  const todos = await leer(registro.usuarioId);
  todos[registro.fecha] = registro;
  await escribir(registro.usuarioId, todos);
}

export async function obtenerPorFecha(usuarioId: string, fecha: string): Promise<RegistroDiario | null> {
  return (await leer(usuarioId))[fecha] ?? null;
}

/** Registros entre dos fechas inclusive, ordenados por fecha. */
export async function obtenerRango(usuarioId: string, desde: string, hasta: string): Promise<RegistroDiario[]> {
  return (await obtenerTodos(usuarioId)).filter((r) => r.fecha >= desde && r.fecha <= hasta);
}

export async function obtenerTodos(usuarioId: string): Promise<RegistroDiario[]> {
  return Object.values(await leer(usuarioId)).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export async function obtenerPendientes(usuarioId: string): Promise<RegistroDiario[]> {
  return (await obtenerTodos(usuarioId)).filter((r) => !r.sincronizado);
}

export async function marcarSincronizados(usuarioId: string, ids: string[]): Promise<void> {
  const todos = await leer(usuarioId);
  for (const registro of Object.values(todos)) {
    if (ids.includes(registro.id)) registro.sincronizado = true;
  }
  await escribir(usuarioId, todos);
}

async function leer(usuarioId: string): Promise<RegistrosPorFecha> {
  const crudo = await AsyncStorage.getItem(CLAVES.registros(usuarioId));
  return crudo ? (JSON.parse(crudo) as RegistrosPorFecha) : {};
}

async function escribir(usuarioId: string, registros: RegistrosPorFecha): Promise<void> {
  await AsyncStorage.setItem(CLAVES.registros(usuarioId), JSON.stringify(registros));
}
