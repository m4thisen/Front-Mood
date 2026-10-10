/**
 * Perfil, preferencias y tags personalizados guardados en el dispositivo
 * (CU-04 paso 9: "guarda el perfil y las preferencias en la base de datos
 * local"), sobre SQLite (baseLocal).
 */
import { FrecuenciaIA, Genero, Idioma, TagPersonalizado, TipoTag, Usuario } from '@/dominio';
import { baseLocal } from './baseLocal';

const SESION_ACTIVA = 'sesion_activa';

interface FilaUsuario {
  id: string;
  nombre: string;
  fecha_nacimiento: string;
  genero: string;
  idioma: string;
  hora_recordatorio: string;
  frecuencia_ia: number;
  zona_horaria: string;
  bloques_activos: string;
  onboarding_completo: number;
}

interface FilaTag {
  id: string;
  nombre: string;
  tipo: string;
  activo: number;
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

/** Id del usuario con la sesión abierta en este dispositivo, si hay uno. */
export async function obtenerSesionActiva(): Promise<string | null> {
  const base = await baseLocal();
  const fila = await base.primera<{ valor: string }>('SELECT valor FROM dispositivo WHERE clave = ?', [SESION_ACTIVA]);
  return fila?.valor ?? null;
}

export async function guardarSesionActiva(usuarioId: string | null): Promise<void> {
  const base = await baseLocal();
  if (usuarioId) {
    await base.ejecutar(
      `INSERT INTO dispositivo (clave, valor) VALUES (?, ?)
       ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor`,
      [SESION_ACTIVA, usuarioId]
    );
  } else {
    await base.ejecutar('DELETE FROM dispositivo WHERE clave = ?', [SESION_ACTIVA]);
  }
}

export async function obtener(usuarioId: string): Promise<Usuario | null> {
  const base = await baseLocal();
  const fila = await base.primera<FilaUsuario>('SELECT * FROM usuario WHERE id = ?', [usuarioId]);
  return fila ? aUsuario(fila) : null;
}

export async function guardar(usuario: Usuario): Promise<void> {
  const base = await baseLocal();
  await base.ejecutar(
    `INSERT INTO usuario (
       id, nombre, fecha_nacimiento, genero, idioma, hora_recordatorio, frecuencia_ia,
       zona_horaria, bloques_activos, onboarding_completo
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       nombre = excluded.nombre,
       fecha_nacimiento = excluded.fecha_nacimiento,
       genero = excluded.genero,
       idioma = excluded.idioma,
       hora_recordatorio = excluded.hora_recordatorio,
       frecuencia_ia = excluded.frecuencia_ia,
       zona_horaria = excluded.zona_horaria,
       bloques_activos = excluded.bloques_activos,
       onboarding_completo = excluded.onboarding_completo`,
    [
      usuario.id,
      usuario.nombre,
      usuario.fechaNacimiento,
      usuario.genero,
      usuario.idioma,
      usuario.horaRecordatorio,
      usuario.frecuenciaIA,
      usuario.zonaHoraria,
      JSON.stringify(usuario.bloquesActivos),
      usuario.onboardingCompleto ? 1 : 0,
    ]
  );
}

/** En el orden en que se crearon. */
export async function obtenerTags(usuarioId: string): Promise<TagPersonalizado[]> {
  const base = await baseLocal();
  const filas = await base.todas<FilaTag>(
    'SELECT id, nombre, tipo, activo FROM tag_personalizado WHERE usuario_id = ? ORDER BY orden',
    [usuarioId]
  );
  return filas.map((f) => ({ id: f.id, nombre: f.nombre, tipo: f.tipo as TipoTag, activo: f.activo === 1 }));
}

/** Reemplaza la lista completa de tags del usuario. */
export async function guardarTags(usuarioId: string, tags: TagPersonalizado[]): Promise<void> {
  const base = await baseLocal();
  await base.transaccion(async (tx) => {
    await tx.ejecutar('DELETE FROM tag_personalizado WHERE usuario_id = ?', [usuarioId]);
    for (const [orden, tag] of tags.entries()) {
      await tx.ejecutar(
        'INSERT INTO tag_personalizado (id, usuario_id, nombre, tipo, activo, orden) VALUES (?, ?, ?, ?, ?, ?)',
        [tag.id, usuarioId, tag.nombre, tag.tipo, tag.activo ? 1 : 0, orden]
      );
    }
  });
}

export async function obtenerPendientes(usuarioId: string): Promise<Pendientes> {
  const base = await baseLocal();
  const fila = await base.primera<{ perfil: number; tags: string }>(
    'SELECT perfil, tags FROM preferencias_pendientes WHERE usuario_id = ?',
    [usuarioId]
  );
  return fila ? { perfil: fila.perfil, tags: JSON.parse(fila.tags) as Record<string, number> } : { perfil: 0, tags: {} };
}

export async function guardarPendientes(usuarioId: string, pendientes: Pendientes): Promise<void> {
  const base = await baseLocal();
  await base.ejecutar(
    `INSERT INTO preferencias_pendientes (usuario_id, perfil, tags) VALUES (?, ?, ?)
     ON CONFLICT (usuario_id) DO UPDATE SET perfil = excluded.perfil, tags = excluded.tags`,
    [usuarioId, pendientes.perfil, JSON.stringify(pendientes.tags)]
  );
}

function aUsuario(fila: FilaUsuario): Usuario {
  return {
    id: fila.id,
    nombre: fila.nombre,
    fechaNacimiento: fila.fecha_nacimiento,
    genero: fila.genero as Genero,
    idioma: fila.idioma as Idioma,
    horaRecordatorio: fila.hora_recordatorio,
    frecuenciaIA: fila.frecuencia_ia as FrecuenciaIA,
    zonaHoraria: fila.zona_horaria,
    bloquesActivos: JSON.parse(fila.bloques_activos) as string[],
    onboardingCompleto: fila.onboarding_completo === 1,
  };
}
