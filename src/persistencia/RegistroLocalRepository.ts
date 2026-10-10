/**
 * RegistroLocalRepository — «persistencia» en el diagrama de clases de la
 * aplicación móvil. Es la base de trabajo y la fuente de verdad de lo que el
 * usuario escribió, sobre SQLite (baseLocal).
 *
 * Un registro ocupa una fila de registro_diario más sus etiquetas y climas en
 * tablas aparte (como en el servidor): así el motor estadístico puede agrupar
 * por etiqueta con SQL. Se escribe siempre todo junto, en una transacción.
 */
import { Clima, NivelAnimo, RegistroDiario } from '@/dominio';
import { baseLocal, Consultas, Valor } from './baseLocal';

interface FilaRegistro {
  id: string;
  usuario_id: string;
  fecha: string;
  nivel_animo: number;
  destacado: number;
  texto: string;
  horas_sueno: number | null;
  minutos_ejercicio: number | null;
  valores_tags: string;
  cancion_spotify_id: string | null;
  cancion_titulo: string | null;
  cancion_artista: string | null;
  cancion_portada_url: string | null;
  hora_carga: string;
  actualizado_en: string;
  pendiente: number;
}

/** Inserta o actualiza el registro. RN-01: la base rechaza un segundo registro para la misma fecha. */
export async function guardar(registro: RegistroDiario): Promise<void> {
  const base = await baseLocal();
  await base.transaccion(async (tx) => {
    const cambios = await tx.ejecutar(
      `INSERT INTO registro_diario (
         id, usuario_id, fecha, nivel_animo, destacado, texto, horas_sueno, minutos_ejercicio,
         valores_tags, cancion_spotify_id, cancion_titulo, cancion_artista, cancion_portada_url,
         hora_carga, actualizado_en, pendiente
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         nivel_animo = excluded.nivel_animo,
         destacado = excluded.destacado,
         texto = excluded.texto,
         horas_sueno = excluded.horas_sueno,
         minutos_ejercicio = excluded.minutos_ejercicio,
         valores_tags = excluded.valores_tags,
         cancion_spotify_id = excluded.cancion_spotify_id,
         cancion_titulo = excluded.cancion_titulo,
         cancion_artista = excluded.cancion_artista,
         cancion_portada_url = excluded.cancion_portada_url,
         actualizado_en = excluded.actualizado_en,
         pendiente = excluded.pendiente
       WHERE registro_diario.usuario_id = excluded.usuario_id`,
      aFila(registro)
    );
    // El id ya existía, pero de otra persona: no se toca nada.
    if (cambios === 0) throw new Error('El registro pertenece a otro usuario.');
    await tx.ejecutar('DELETE FROM registro_etiqueta WHERE registro_id = ?', [registro.id]);
    for (const etiqueta of new Set(registro.etiquetas)) {
      await tx.ejecutar('INSERT INTO registro_etiqueta (registro_id, etiqueta) VALUES (?, ?)', [registro.id, etiqueta]);
    }
    await tx.ejecutar('DELETE FROM registro_clima WHERE registro_id = ?', [registro.id]);
    for (const clima of new Set(registro.climas)) {
      await tx.ejecutar('INSERT INTO registro_clima (registro_id, clima) VALUES (?, ?)', [registro.id, clima]);
    }
  });
}

export async function obtenerPorFecha(usuarioId: string, fecha: string): Promise<RegistroDiario | null> {
  const [registro] = await leer('usuario_id = ? AND fecha = ?', [usuarioId, fecha]);
  return registro ?? null;
}

/** Registros entre dos fechas inclusive, ordenados por fecha. */
export function obtenerRango(usuarioId: string, desde: string, hasta: string): Promise<RegistroDiario[]> {
  return leer('usuario_id = ? AND fecha BETWEEN ? AND ?', [usuarioId, desde, hasta]);
}

export function obtenerTodos(usuarioId: string): Promise<RegistroDiario[]> {
  return leer('usuario_id = ?', [usuarioId]);
}

export function obtenerPendientes(usuarioId: string): Promise<RegistroDiario[]> {
  return leer('usuario_id = ? AND pendiente = 1', [usuarioId]);
}

export async function marcarSincronizados(usuarioId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const base = await baseLocal();
  await base.ejecutar(
    `UPDATE registro_diario SET pendiente = 0 WHERE usuario_id = ? AND id IN (${ids.map(() => '?').join(', ')})`,
    [usuarioId, ...ids]
  );
}

/** Lee los registros que cumplen la condición, con sus etiquetas y climas, en una sola transacción. */
async function leer(condicion: string, parametros: Valor[]): Promise<RegistroDiario[]> {
  const base = await baseLocal();
  return base.transaccion(async (tx) => {
    const filas = await tx.todas<FilaRegistro>(
      `SELECT * FROM registro_diario WHERE ${condicion} ORDER BY fecha`,
      parametros
    );
    if (filas.length === 0) return [];
    const etiquetas = await agrupar(tx, 'etiqueta', 'registro_etiqueta', condicion, parametros);
    const climas = await agrupar(tx, 'clima', 'registro_clima', condicion, parametros);
    return filas.map((fila) => aRegistro(fila, etiquetas.get(fila.id) ?? [], (climas.get(fila.id) ?? []) as Clima[]));
  });
}

async function agrupar(
  tx: Consultas,
  columna: 'etiqueta' | 'clima',
  tabla: 'registro_etiqueta' | 'registro_clima',
  condicion: string,
  parametros: Valor[]
): Promise<Map<string, string[]>> {
  const filas = await tx.todas<{ registro_id: string; valor: string }>(
    `SELECT registro_id, ${columna} AS valor FROM ${tabla}
     WHERE registro_id IN (SELECT id FROM registro_diario WHERE ${condicion})
     ORDER BY rowid`,
    parametros
  );
  const porRegistro = new Map<string, string[]>();
  for (const { registro_id, valor } of filas) {
    porRegistro.set(registro_id, [...(porRegistro.get(registro_id) ?? []), valor]);
  }
  return porRegistro;
}

function aFila(r: RegistroDiario): Valor[] {
  return [
    r.id,
    r.usuarioId,
    r.fecha,
    r.nivelAnimo,
    r.destacado ? 1 : 0,
    r.texto,
    r.horasSueno,
    r.minutosEjercicio,
    JSON.stringify(r.valoresTags),
    r.cancion?.spotifyId ?? null,
    r.cancion?.titulo ?? null,
    r.cancion?.artista ?? null,
    r.cancion?.portadaUrl ?? null,
    r.horaCarga,
    r.actualizadoEn,
    r.sincronizado ? 0 : 1,
  ];
}

function aRegistro(fila: FilaRegistro, etiquetas: string[], climas: Clima[]): RegistroDiario {
  return {
    id: fila.id,
    usuarioId: fila.usuario_id,
    fecha: fila.fecha,
    nivelAnimo: fila.nivel_animo as NivelAnimo,
    destacado: fila.destacado === 1,
    texto: fila.texto,
    horasSueno: fila.horas_sueno,
    minutosEjercicio: fila.minutos_ejercicio,
    climas,
    etiquetas,
    valoresTags: JSON.parse(fila.valores_tags) as RegistroDiario['valoresTags'],
    cancion:
      fila.cancion_titulo !== null
        ? {
            spotifyId: fila.cancion_spotify_id ?? '',
            titulo: fila.cancion_titulo,
            artista: fila.cancion_artista ?? '',
            portadaUrl: fila.cancion_portada_url,
          }
        : null,
    horaCarga: fila.hora_carga,
    actualizadoEn: fila.actualizado_en,
    sincronizado: fila.pendiente === 0,
  };
}
