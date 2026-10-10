import { Cancion } from './Cancion';
import { Clima, NivelAnimo } from './tipos';

/** Lo que el usuario cuenta sobre un día (entidad central del dominio). */
export interface RegistroDiario {
  /** UUID generado en el dispositivo. */
  id: string;
  usuarioId: string;
  /** yyyy-mm-dd, determinada en el dispositivo según su zona horaria. */
  fecha: string;
  /** RN-02: único dato obligatorio. */
  nivelAnimo: NivelAnimo;
  destacado: boolean;
  /** Texto libre. Nunca sale del sistema hacia la IA. */
  texto: string;
  horasSueno: number | null;
  minutosEjercicio: number | null;
  climas: Clima[];
  /** Claves de las etiquetas marcadas de los bloques activos. */
  etiquetas: string[];
  /** id del TagPersonalizado → valor (sí/no o texto). */
  valoresTags: Record<string, boolean | string>;
  cancion: Cancion | null;
  /** ISO. Cuándo se cargó por primera vez (RF-15); no cambia al editar. */
  horaCarga: string;
  /** ISO. Cuándo lo modificó el usuario por última vez. */
  actualizadoEn: string;
  /** false mientras está pendiente de sincronizar con el servidor. */
  sincronizado: boolean;
}

/** Los campos que el usuario completa en el formulario de "Hoy". */
export type DatosRegistro = Pick<
  RegistroDiario,
  | 'destacado'
  | 'texto'
  | 'horasSueno'
  | 'minutosEjercicio'
  | 'climas'
  | 'etiquetas'
  | 'valoresTags'
  | 'cancion'
> & { nivelAnimo: NivelAnimo | null };

export const RANGO_HORAS_SUENO = { min: 0, max: 24 } as const;
export const RANGO_MINUTOS_EJERCICIO = { min: 0, max: 1440 } as const;

export type ErrorValidacion =
  | 'ANIMO_REQUERIDO'
  | 'HORAS_SUENO_FUERA_DE_RANGO'
  | 'MINUTOS_EJERCICIO_FUERA_DE_RANGO';

/** Por qué no se pudo guardar: datos inválidos o un día que ya terminó (RN-03). */
export type ErrorGuardado = ErrorValidacion | 'DIA_TERMINADO';

/** RN-03: solo se puede crear y editar el registro del día actual. */
export function esEditable(registro: Pick<RegistroDiario, 'fecha'>, hoy: string): boolean {
  return registro.fecha === hoy;
}

/** RN-02 y rangos de los valores numéricos (CU-09, excepciones E1 y E2). */
export function validar(datos: DatosRegistro): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  if (datos.nivelAnimo === null) errores.push('ANIMO_REQUERIDO');
  if (!estaEnRango(datos.horasSueno, RANGO_HORAS_SUENO)) errores.push('HORAS_SUENO_FUERA_DE_RANGO');
  if (!estaEnRango(datos.minutosEjercicio, RANGO_MINUTOS_EJERCICIO)) {
    errores.push('MINUTOS_EJERCICIO_FUERA_DE_RANGO');
  }
  return errores;
}

const estaEnRango = (valor: number | null, rango: { min: number; max: number }): boolean =>
  valor === null || (Number.isFinite(valor) && valor >= rango.min && valor <= rango.max);
