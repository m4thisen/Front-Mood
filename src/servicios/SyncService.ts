/**
 * SyncService — «servicio» en el diagrama de clases de la aplicación móvil.
 * Mantiene alineado el historial del dispositivo con el del servidor (CU-12):
 * manda los registros pendientes y trae lo que todavía no tiene.
 *
 * Es silencioso y tolerante a cortes: ante una falla los registros quedan
 * pendientes y se reintenta con una espera creciente (E1, E2). Nunca se
 * pierde ni se duplica nada: el servidor ignora los reenvíos y solo se marca
 * como sincronizado lo que no cambió mientras viajaba.
 */
import { ApiClient, ErrorApi } from '@/api/ApiClient';
import { aRegistroApi, deRegistroApi, PedidoSync, RespuestaSync } from '@/api/registros';
import { RegistroDiario } from '@/dominio';

/** Lo que se usa de la base local; en las pruebas se reemplaza. */
export interface DatosLocalesSync {
  obtenerPendientes(usuarioId: string): Promise<RegistroDiario[]>;
  marcarSincronizados(usuarioId: string, enviados: Pick<RegistroDiario, 'id' | 'actualizadoEn'>[]): Promise<void>;
  marcarRechazados(usuarioId: string, ids: string[]): Promise<void>;
  aplicarDelServidor(usuarioId: string, registros: RegistroDiario[]): Promise<void>;
  obtenerCursor(usuarioId: string): Promise<string | null>;
  guardarCursor(usuarioId: string, cursor: string | null): Promise<void>;
}

export interface ResultadoSync {
  enviados: number;
  recibidos: number;
  rechazados: number;
}

/** El servidor acepta hasta 50; tandas más chicas viajan mejor con mala señal. */
export const REGISTROS_POR_TANDA = 25;
/** Tope de vueltas por sincronización (un historial de varios años entra holgado). */
const MAXIMO_DE_VUELTAS = 100;
const ESPERA_INICIAL_MS = 30_000;
const ESPERA_MAXIMA_MS = 15 * 60_000;

export class SyncService {
  /** Hasta dónde llegó la última sincronización (diagrama de clases). */
  cursor: string | null = null;

  private enCurso: Promise<ResultadoSync | null> | null = null;
  private usuarioEnCurso: string | null = null;
  private repetir = false;
  private espera = 0;
  private reintento: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly api: Pick<ApiClient, 'post'>,
    private readonly local: DatosLocalesSync,
    /** Si la sesión abierta sigue siendo la de esa persona: nunca se sincroniza con el token de otra. */
    private readonly esLaSesionDe: (usuarioId: string) => boolean
  ) {}

  /**
   * Sincroniza ahora. Si ya hay una en curso, al terminar se hace otra vuelta
   * con lo que haya cambiado mientras tanto. Nunca falla: devuelve null si no
   * se pudo, y queda programado el reintento.
   */
  sincronizar(usuarioId: string): Promise<ResultadoSync | null> {
    if (this.enCurso) {
      if (this.usuarioEnCurso !== usuarioId) return this.enCurso.then(() => this.sincronizar(usuarioId));
      this.repetir = true;
      return this.enCurso;
    }
    this.cancelarReintento();
    this.usuarioEnCurso = usuarioId;
    this.enCurso = (async () => {
      let total: ResultadoSync | null = null;
      do {
        this.repetir = false;
        const vuelta = await this.intentar(usuarioId);
        if (!vuelta) return total;
        total = sumar(total, vuelta);
      } while (this.repetir);
      return total;
    })().finally(() => {
      this.enCurso = null;
    });
    return this.enCurso;
  }

  /** Al cerrar sesión: no quedan reintentos programados. */
  detener(): void {
    this.cancelarReintento();
    this.espera = 0;
  }

  private async intentar(usuarioId: string): Promise<ResultadoSync | null> {
    try {
      const resultado = await this.enviarYRecibir(usuarioId);
      this.espera = 0;
      return resultado;
    } catch (error) {
      if (error instanceof ErrorApi) {
        // La sesión se perdió: AuthService ya avisó; no se reintenta.
        if (error.codigo === 'SESION_PERDIDA') return null;
        // El servidor no entendió el cursor (por ejemplo, de una versión vieja): se empieza de cero.
        if (error.estado === 400) await this.local.guardarCursor(usuarioId, null);
      }
      this.programarReintento(usuarioId);
      return null;
    }
  }

  private async enviarYRecibir(usuarioId: string): Promise<ResultadoSync> {
    const total: ResultadoSync = { enviados: 0, recibidos: 0, rechazados: 0 };
    let cursor = await this.local.obtenerCursor(usuarioId);

    for (let vuelta = 0; vuelta < MAXIMO_DE_VUELTAS && this.esLaSesionDe(usuarioId); vuelta += 1) {
      const tanda = (await this.local.obtenerPendientes(usuarioId)).slice(0, REGISTROS_POR_TANDA);
      const pedido: PedidoSync = { cursor, registros: tanda.map(aRegistroApi) };
      const respuesta = await this.api.post<RespuestaSync>('/sync', pedido);

      const aceptados = new Set(respuesta.aceptados);
      await this.local.marcarSincronizados(usuarioId, tanda.filter((r) => aceptados.has(r.id)));
      await this.local.marcarRechazados(usuarioId, respuesta.rechazados.map((r) => r.id));
      await this.local.aplicarDelServidor(usuarioId, respuesta.cambios.map((r) => deRegistroApi(r, usuarioId)));
      cursor = respuesta.nuevoCursor ?? cursor;
      await this.local.guardarCursor(usuarioId, cursor);

      total.enviados += aceptados.size;
      total.recibidos += respuesta.cambios.length;
      total.rechazados += respuesta.rechazados.length;
      if (!respuesta.hayMas && tanda.length < REGISTROS_POR_TANDA) break;
    }
    this.cursor = cursor;
    return total;
  }

  /** E1, E2: espera creciente (30 s, 1 min, 2 min… hasta 15 min). */
  private programarReintento(usuarioId: string): void {
    this.espera = this.espera === 0 ? ESPERA_INICIAL_MS : Math.min(this.espera * 2, ESPERA_MAXIMA_MS);
    this.cancelarReintento();
    this.reintento = setTimeout(() => {
      this.reintento = null;
      if (this.esLaSesionDe(usuarioId)) void this.sincronizar(usuarioId);
    }, this.espera);
  }

  private cancelarReintento(): void {
    if (this.reintento) clearTimeout(this.reintento);
    this.reintento = null;
  }
}

function sumar(a: ResultadoSync | null, b: ResultadoSync): ResultadoSync {
  if (!a) return b;
  return { enviados: a.enviados + b.enviados, recibidos: a.recibidos + b.recibidos, rechazados: a.rechazados + b.rechazados };
}
