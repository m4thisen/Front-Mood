/**
 * Perfil, preferencias y tags personalizados guardados en el dispositivo
 * (CU-04 paso 9: "guarda el perfil y las preferencias en la base de datos
 * local").
 *
 * Implementación provisoria sobre AsyncStorage. En la iteración 2 pasa a
 * SQLite manteniendo estas mismas funciones.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TagPersonalizado, Usuario } from '@/dominio';
import { CLAVES } from './claves';

/** Id del usuario con la sesión abierta en este dispositivo, si hay uno. */
export async function obtenerSesionActiva(): Promise<string | null> {
  return AsyncStorage.getItem(CLAVES.sesionActiva);
}

export async function guardarSesionActiva(usuarioId: string | null): Promise<void> {
  if (usuarioId) await AsyncStorage.setItem(CLAVES.sesionActiva, usuarioId);
  else await AsyncStorage.removeItem(CLAVES.sesionActiva);
}

export async function obtener(usuarioId: string): Promise<Usuario | null> {
  return leerJson<Usuario>(CLAVES.usuario(usuarioId));
}

export async function guardar(usuario: Usuario): Promise<void> {
  await AsyncStorage.setItem(CLAVES.usuario(usuario.id), JSON.stringify(usuario));
}

export async function obtenerTags(usuarioId: string): Promise<TagPersonalizado[]> {
  return (await leerJson<TagPersonalizado[]>(CLAVES.tags(usuarioId))) ?? [];
}

export async function guardarTags(usuarioId: string, tags: TagPersonalizado[]): Promise<void> {
  await AsyncStorage.setItem(CLAVES.tags(usuarioId), JSON.stringify(tags));
}

/**
 * Cambios guardados en el dispositivo que todavía no llegaron al servidor.
 * Cada uno lleva un número de versión que sube con cada cambio, para no dar
 * por enviado algo que cambió mientras se mandaba la versión anterior.
 */
export interface Pendientes {
  /** Versión del perfil sin enviar; 0 si no hay nada pendiente. */
  perfil: number;
  /** Versión de cada tag sin enviar, por id. */
  tags: Record<string, number>;
}

export async function obtenerPendientes(usuarioId: string): Promise<Pendientes> {
  return (await leerJson<Pendientes>(CLAVES.pendientes(usuarioId))) ?? { perfil: 0, tags: {} };
}

export async function guardarPendientes(usuarioId: string, pendientes: Pendientes): Promise<void> {
  await AsyncStorage.setItem(CLAVES.pendientes(usuarioId), JSON.stringify(pendientes));
}

async function leerJson<T>(clave: string): Promise<T | null> {
  const crudo = await AsyncStorage.getItem(clave);
  return crudo ? (JSON.parse(crudo) as T) : null;
}
