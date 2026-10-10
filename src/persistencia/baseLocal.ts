/**
 * Base local SQLite: la fuente de verdad de lo que el usuario escribió
 * (arquitectura offline-first). SQLite y no AsyncStorage porque permite
 * consultar por rango y agrupar sin cargar todo en memoria.
 *
 * Una sola base para el dispositivo; todo lo del usuario lleva su usuario_id,
 * así otra cuenta en el mismo teléfono no ve esos datos. El esquema se
 * versiona como las migraciones del servidor: cada cambio es una migración
 * nueva al final de la lista, nunca se edita una ya publicada.
 */
import * as SQLite from 'expo-sqlite';

export type Valor = string | number | null;

export interface Consultas {
  /** Devuelve cuántas filas cambió. */
  ejecutar(sql: string, parametros?: Valor[]): Promise<number>;
  primera<T>(sql: string, parametros?: Valor[]): Promise<T | null>;
  todas<T>(sql: string, parametros?: Valor[]): Promise<T[]>;
}

export interface BaseLocal extends Consultas {
  /** O se aplica todo o no se aplica nada. */
  transaccion<T>(trabajo: (tx: Consultas) => Promise<T>): Promise<T>;
}

const CLIMAS = "'SOLEADO', 'NUBLADO', 'LLUVIA', 'FRIO', 'CALOR'";

/**
 * Esquema local. Replica registro_diario del servidor más el indicador de
 * pendiente de sincronización; las restricciones repiten las reglas del
 * dominio (RN-01, RN-02, RN-06 y rangos de CU-09).
 */
export const MIGRACIONES: readonly string[] = [
  `
  CREATE TABLE dispositivo (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  ) STRICT;

  CREATE TABLE usuario (
    id                  TEXT PRIMARY KEY,
    nombre              TEXT NOT NULL,
    fecha_nacimiento    TEXT NOT NULL,
    genero              TEXT NOT NULL,
    idioma              TEXT NOT NULL CHECK (idioma IN ('es', 'en')),
    hora_recordatorio   TEXT NOT NULL,
    frecuencia_ia       INTEGER NOT NULL CHECK (frecuencia_ia IN (1, 3, 7, 14)),
    zona_horaria        TEXT NOT NULL,
    -- Lista corta que siempre se lee entera: no hace falta una tabla aparte.
    bloques_activos     TEXT NOT NULL DEFAULT '[]',
    onboarding_completo INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_completo IN (0, 1))
  ) STRICT;

  CREATE TABLE tag_personalizado (
    id         TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    nombre     TEXT NOT NULL CHECK (length(nombre) BETWEEN 1 AND 40),
    tipo       TEXT NOT NULL CHECK (tipo IN ('SI_NO', 'TEXTO')),
    activo     INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    orden      INTEGER NOT NULL
  ) STRICT;
  CREATE INDEX tag_por_usuario ON tag_personalizado (usuario_id, orden);

  CREATE TABLE preferencias_pendientes (
    usuario_id TEXT PRIMARY KEY REFERENCES usuario (id) ON DELETE CASCADE,
    perfil     INTEGER NOT NULL DEFAULT 0,
    tags       TEXT NOT NULL DEFAULT '{}'
  ) STRICT;

  CREATE TABLE registro_diario (
    id                  TEXT PRIMARY KEY,
    usuario_id          TEXT NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    fecha               TEXT NOT NULL CHECK (fecha GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    nivel_animo         INTEGER NOT NULL CHECK (nivel_animo BETWEEN 1 AND 5),
    destacado           INTEGER NOT NULL DEFAULT 0 CHECK (destacado IN (0, 1)),
    texto               TEXT NOT NULL DEFAULT '',
    horas_sueno         REAL CHECK (horas_sueno BETWEEN 0 AND 24),
    minutos_ejercicio   INTEGER CHECK (minutos_ejercicio BETWEEN 0 AND 1440),
    -- {"id-del-tag": valor}, igual que el JSONB del servidor.
    valores_tags        TEXT NOT NULL DEFAULT '{}',
    cancion_spotify_id  TEXT,
    cancion_titulo      TEXT,
    cancion_artista     TEXT,
    cancion_portada_url TEXT,
    hora_carga          TEXT NOT NULL,
    actualizado_en      TEXT NOT NULL,
    -- Lo asigna el servidor al sincronizar (iteración 3).
    sincronizado_en     TEXT,
    pendiente           INTEGER NOT NULL DEFAULT 1 CHECK (pendiente IN (0, 1)),
    UNIQUE (usuario_id, fecha)
  ) STRICT;
  CREATE INDEX registro_pendiente ON registro_diario (usuario_id) WHERE pendiente = 1;

  CREATE TABLE registro_etiqueta (
    registro_id TEXT NOT NULL REFERENCES registro_diario (id) ON DELETE CASCADE,
    etiqueta    TEXT NOT NULL,
    PRIMARY KEY (registro_id, etiqueta)
  ) STRICT;
  CREATE INDEX registro_por_etiqueta ON registro_etiqueta (etiqueta);

  CREATE TABLE registro_clima (
    registro_id TEXT NOT NULL REFERENCES registro_diario (id) ON DELETE CASCADE,
    clima       TEXT NOT NULL CHECK (clima IN (${CLIMAS})),
    PRIMARY KEY (registro_id, clima)
  ) STRICT;
  `,
];

let instancia: Promise<BaseSQLite> | null = null;

/** La base del dispositivo, abierta y al día con las migraciones. */
export function baseLocal(): Promise<BaseLocal> {
  instancia ??= abrir().catch((error: unknown) => {
    instancia = null;
    throw error;
  });
  return instancia;
}

/** Cierra la conexión; la próxima llamada a baseLocal() la vuelve a abrir. */
export async function cerrarBaseLocal(): Promise<void> {
  const abierta = instancia;
  instancia = null;
  if (abierta) await (await abierta.catch(() => null))?.cerrar();
}

async function abrir(): Promise<BaseSQLite> {
  const db = await SQLite.openDatabaseAsync('mood.db');
  // Por conexión y fuera de cualquier transacción.
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrar(db);
  return new BaseSQLite(db);
}

async function migrar(db: SQLite.SQLiteDatabase): Promise<void> {
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  for (let version = fila?.user_version ?? 0; version < MIGRACIONES.length; version += 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRACIONES[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}

/**
 * Todas las consultas pasan en fila por esta clase: así ninguna se mete en
 * medio de una transacción ajena (expo-sqlite comparte la conexión).
 */
class BaseSQLite implements BaseLocal {
  private cola: Promise<unknown> = Promise.resolve();
  private readonly directas: Consultas;

  constructor(private readonly db: SQLite.SQLiteDatabase) {
    this.directas = {
      ejecutar: async (sql, parametros = []) => (await db.runAsync(sql, parametros)).changes,
      primera: (sql, parametros = []) => db.getFirstAsync(sql, parametros),
      todas: (sql, parametros = []) => db.getAllAsync(sql, parametros),
    };
  }

  ejecutar(sql: string, parametros?: Valor[]): Promise<number> {
    return this.enFila(() => this.directas.ejecutar(sql, parametros));
  }

  primera<T>(sql: string, parametros?: Valor[]): Promise<T | null> {
    return this.enFila(() => this.directas.primera<T>(sql, parametros));
  }

  todas<T>(sql: string, parametros?: Valor[]): Promise<T[]> {
    return this.enFila(() => this.directas.todas<T>(sql, parametros));
  }

  transaccion<T>(trabajo: (tx: Consultas) => Promise<T>): Promise<T> {
    return this.enFila(async () => {
      let resultado: T | undefined;
      await this.db.withTransactionAsync(async () => {
        resultado = await trabajo(this.directas);
      });
      return resultado as T;
    });
  }

  cerrar(): Promise<void> {
    return this.enFila(() => this.db.closeAsync());
  }

  private enFila<T>(operacion: () => Promise<T>): Promise<T> {
    const resultado = this.cola.then(operacion);
    this.cola = resultado.catch(() => undefined);
    return resultado;
  }
}
