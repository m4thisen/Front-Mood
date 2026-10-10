/**
 * Reemplazo de expo-sqlite para las pruebas: la parte de su API que usa
 * baseLocal, sobre sql.js (el motor SQLite real compilado a JavaScript). Así
 * las pruebas corren el SQL de verdad, con sus restricciones y transacciones.
 *
 * Uso: jest.mock('expo-sqlite', () => require('@/__pruebas__/sqliteEnMemoria'));
 */
type Parametros = (string | number | null)[];

interface Sentencia {
  bind(parametros: Parametros): void;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  free(): void;
}

interface BaseSqlJs {
  exec(sql: string): unknown;
  run(sql: string, parametros: Parametros): void;
  prepare(sql: string): Sentencia;
  getRowsModified(): number;
  close(): void;
}

type MotorSqlJs = { Database: new () => BaseSqlJs };

let motor: Promise<MotorSqlJs> | null = null;
const bases = new Map<string, BaseSqlJs>();

function cargarMotor(): Promise<MotorSqlJs> {
  // La versión asm.js: no necesita cargar un .wasm aparte.
  motor ??= (require('sql.js/dist/sql-asm.js') as () => Promise<MotorSqlJs>)();
  return motor;
}

class BaseEnMemoria {
  constructor(private readonly db: BaseSqlJs) {}

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(sql: string, parametros: Parametros = []): Promise<{ changes: number; lastInsertRowId: number }> {
    this.db.run(sql, parametros);
    return { changes: this.db.getRowsModified(), lastInsertRowId: 0 };
  }

  async getAllAsync<T>(sql: string, parametros: Parametros = []): Promise<T[]> {
    const sentencia = this.db.prepare(sql);
    try {
      sentencia.bind(parametros);
      const filas: T[] = [];
      while (sentencia.step()) filas.push(sentencia.getAsObject() as T);
      return filas;
    } finally {
      sentencia.free();
    }
  }

  async getFirstAsync<T>(sql: string, parametros: Parametros = []): Promise<T | null> {
    return (await this.getAllAsync<T>(sql, parametros))[0] ?? null;
  }

  async withTransactionAsync(tarea: () => Promise<void>): Promise<void> {
    this.db.exec('BEGIN');
    try {
      await tarea();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /** La base sigue en memoria, como un archivo que queda en el teléfono. */
  async closeAsync(): Promise<void> {}
}

export async function openDatabaseAsync(nombre: string): Promise<BaseEnMemoria> {
  const SQL = await cargarMotor();
  let db = bases.get(nombre);
  if (!db) {
    db = new SQL.Database();
    bases.set(nombre, db);
  }
  return new BaseEnMemoria(db);
}

/** Borra todas las bases, como desinstalar la app. */
export function borrarBasesEnMemoria(): void {
  for (const db of bases.values()) db.close();
  bases.clear();
}
