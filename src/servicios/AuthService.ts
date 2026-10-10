/**
 * AuthService — «servicio» en el diagrama de clases de la aplicación móvil.
 * Entra con la identidad de Google (CU-01, CU-02), renueva la sesión cuando el
 * token de acceso vence y la cierra (CU-03).
 *
 * El servidor rota el token de refresco en cada uso y, si ve uno ya usado,
 * cierra todas las sesiones de la persona. Por eso acá:
 * - hay una sola renovación a la vez, y los pedidos que llegan mientras tanto
 *   esperan esa misma;
 * - al cerrar sesión no puede quedar ninguna renovación en vuelo.
 */
import { ApiClient, ErrorApi, ProveedorSesion } from '@/api/ApiClient';
import { Idioma } from '@/dominio';
import { AlmacenSeguro, TokensGuardados } from '@/persistencia/AlmacenSeguro';

/** De dónde sale el idToken de Google. Null si la persona canceló. */
export interface ProveedorIdentidad {
  obtenerIdToken(): Promise<string | null>;
}

interface RespuestaIngreso extends TokensGuardados {
  esNuevo: boolean;
}

export class AuthService implements ProveedorSesion {
  private renovacionEnCurso: Promise<string | null> | null = null;
  private cerrando = false;
  private alPerder: (() => void) | null = null;

  constructor(
    private readonly api: ApiClient,
    private readonly almacen: AlmacenSeguro,
    private readonly identidad: ProveedorIdentidad,
    private readonly zonaHoraria: () => string
  ) {}

  /**
   * CU-01 y CU-02: el mismo camino para crear cuenta y para entrar; el
   * servidor decide. Devuelve null si la persona canceló.
   */
  async ingresarConGoogle(idioma: Idioma): Promise<{ esNuevo: boolean } | null> {
    const idToken = await this.identidad.obtenerIdToken();
    if (!idToken) return null;

    const respuesta = await this.api.post<RespuestaIngreso>(
      '/auth/google',
      { idToken, idioma, zonaHoraria: this.zonaHoraria() },
      { publico: true }
    );
    await this.almacen.guardarTokens(respuesta);
    return { esNuevo: respuesta.esNuevo };
  }

  async haySesion(): Promise<boolean> {
    return (await this.almacen.leerTokens()) !== null;
  }

  async tokenAcceso(): Promise<string | null> {
    return (await this.almacen.leerTokens())?.accessToken ?? null;
  }

  renovar(tokenVencido: string): Promise<string | null> {
    if (this.cerrando) return Promise.resolve(null);
    if (!this.renovacionEnCurso) {
      this.renovacionEnCurso = this.pedirTokensNuevos(tokenVencido).finally(() => {
        this.renovacionEnCurso = null;
      });
    }
    return this.renovacionEnCurso;
  }

  /**
   * CU-03. Primero espera cualquier renovación en vuelo y borra los tokens
   * del dispositivo; recién después avisa al servidor, sin esperar la
   * respuesta. Si no hay conexión, la sesión del servidor vence sola.
   */
  async cerrarSesion(): Promise<void> {
    this.cerrando = true;
    try {
      await this.renovacionEnCurso?.catch(() => null);
      const tokens = await this.almacen.leerTokens();
      await this.almacen.borrar();
      if (tokens) {
        void this.api
          .post('/auth/logout', { refreshToken: tokens.refreshToken }, { publico: true })
          .catch(() => undefined);
      }
    } finally {
      this.cerrando = false;
    }
  }

  /** Para que SesionStore vuelva a la bienvenida si el servidor da la sesión por terminada. */
  alPerderSesion(aviso: () => void): void {
    this.alPerder = aviso;
  }

  private async pedirTokensNuevos(tokenVencido: string): Promise<string | null> {
    const tokens = await this.almacen.leerTokens();
    if (!tokens) return null;
    // Otro pedido ya renovó mientras este esperaba: no hace falta otra vuelta.
    if (tokens.accessToken !== tokenVencido) return tokens.accessToken;

    try {
      const nuevos = await this.api.post<TokensGuardados>(
        '/auth/refresh',
        { refreshToken: tokens.refreshToken },
        { publico: true }
      );
      await this.almacen.guardarTokens(nuevos);
      return nuevos.accessToken;
    } catch (error) {
      // 401: la sesión venció, se cerró en otro lado o se revocó por reuso.
      // Cualquier otro error (sin conexión, 429, 500) deja la sesión como está.
      if (error instanceof ErrorApi && error.estado === 401) {
        await this.almacen.borrar();
        this.alPerder?.();
        return null;
      }
      throw error;
    }
  }
}
