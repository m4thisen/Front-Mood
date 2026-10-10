/**
 * ApiClient — «servicio» en el diagrama de clases de la aplicación móvil.
 * Único punto de salida hacia el servidor: arma el pedido, le adjunta el
 * token de acceso y traduce las respuestas de error a ErrorApi.
 *
 * Si el servidor responde 401, le pide a la sesión un token nuevo y repite el
 * pedido una sola vez. Cómo se consigue ese token (y que dos pedidos no
 * renueven a la vez) es responsabilidad de AuthService.
 */

/** Lo que ApiClient necesita de la sesión. Lo implementa AuthService. */
export interface ProveedorSesion {
  /** Token de acceso guardado, o null si no hay sesión. */
  tokenAcceso(): Promise<string | null>;
  /** Token nuevo para reemplazar al vencido, o null si la sesión se perdió. */
  renovar(tokenVencido: string): Promise<string | null>;
}

/**
 * Códigos que genera la propia app. El resto viene tal cual del servidor
 * (DATOS_INVALIDOS, NOMBRE_REPETIDO, DEMASIADOS_PEDIDOS, …).
 */
export type CodigoErrorApp = 'SIN_CONEXION' | 'SESION_PERDIDA' | 'RESPUESTA_INESPERADA';

export class ErrorApi extends Error {
  constructor(
    readonly codigo: CodigoErrorApp | (string & {}),
    /** Estado HTTP, o null si el pedido no llegó a tener respuesta. */
    readonly estado: number | null
  ) {
    super(codigo);
    this.name = 'ErrorApi';
  }
}

interface OpcionesPedido {
  /** Rutas sin sesión (/auth/*): no llevan token ni se reintentan. */
  publico?: boolean;
}

type Metodo = 'GET' | 'POST' | 'PATCH';

/** fetch, con una sola firma: en las pruebas se reemplaza por un servidor falso. */
export type PedirHttp = (url: string, init: RequestInit) => Promise<Response>;

export class ApiClient {
  constructor(
    private readonly urlBase: string,
    private readonly sesion: ProveedorSesion,
    private readonly pedirHttp: PedirHttp = (url, init) => fetch(url, init),
    private readonly tiempoMaximoMs = 15_000
  ) {}

  get<T>(ruta: string): Promise<T> {
    return this.pedir<T>('GET', ruta, undefined, {});
  }

  post<T>(ruta: string, cuerpo?: unknown, opciones: OpcionesPedido = {}): Promise<T> {
    return this.pedir<T>('POST', ruta, cuerpo, opciones);
  }

  patch<T>(ruta: string, cuerpo: unknown): Promise<T> {
    return this.pedir<T>('PATCH', ruta, cuerpo, {});
  }

  private async pedir<T>(metodo: Metodo, ruta: string, cuerpo: unknown, { publico = false }: OpcionesPedido): Promise<T> {
    if (publico) return this.leer<T>(await this.enviar(metodo, ruta, cuerpo, null));

    const token = await this.sesion.tokenAcceso();
    if (!token) throw new ErrorApi('SESION_PERDIDA', null);

    const respuesta = await this.enviar(metodo, ruta, cuerpo, token);
    if (respuesta.status !== 401) return this.leer<T>(respuesta);

    // Token vencido (o inválido): uno nuevo y un único reintento.
    const nuevo = await this.sesion.renovar(token);
    if (!nuevo) throw new ErrorApi('SESION_PERDIDA', 401);
    return this.leer<T>(await this.enviar(metodo, ruta, cuerpo, nuevo));
  }

  private async enviar(metodo: Metodo, ruta: string, cuerpo: unknown, token: string | null): Promise<Response> {
    const encabezados: Record<string, string> = { Accept: 'application/json' };
    if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
    this.adjuntarToken(encabezados, token);

    const corte = new AbortController();
    const temporizador = setTimeout(() => corte.abort(), this.tiempoMaximoMs);
    try {
      return await this.pedirHttp(`${this.urlBase}${ruta}`, {
        method: metodo,
        headers: encabezados,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        signal: corte.signal,
      });
    } catch {
      // Sin red, servidor caído o demasiado lento: para la app es lo mismo.
      throw new ErrorApi('SIN_CONEXION', null);
    } finally {
      clearTimeout(temporizador);
    }
  }

  private adjuntarToken(encabezados: Record<string, string>, token: string | null): void {
    if (token) encabezados.Authorization = `Bearer ${token}`;
  }

  private async leer<T>(respuesta: Response): Promise<T> {
    if (respuesta.status === 204) return undefined as T;
    const cuerpo: unknown = await respuesta.json().catch(() => null);
    if (respuesta.ok) return cuerpo as T;

    const codigo =
      cuerpo !== null && typeof cuerpo === 'object' && 'error' in cuerpo && typeof cuerpo.error === 'string'
        ? cuerpo.error
        : 'RESPUESTA_INESPERADA';
    throw new ErrorApi(codigo, respuesta.status);
  }
}
