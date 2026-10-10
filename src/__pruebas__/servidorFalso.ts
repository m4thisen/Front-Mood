/**
 * Servidor de mentira para probar ApiClient y AuthService sin red, con las
 * mismas reglas de sesión que el real: el token de refresco rota en cada uso
 * y, si aparece uno ya usado, se cierran todas las sesiones.
 */
import type { PedirHttp } from '@/api/ApiClient';
import type { Llavero } from '@/persistencia/AlmacenSeguro';

export const URL_FALSA = 'https://api.prueba';

interface PedidoRecibido {
  metodo: string;
  ruta: string;
  cuerpo: Record<string, unknown> | undefined;
  autorizacion: string | undefined;
}

export function respuesta(estado: number, cuerpo?: unknown): Response {
  return {
    status: estado,
    ok: estado >= 200 && estado < 300,
    json: async () => {
      if (cuerpo === undefined) throw new SyntaxError('sin cuerpo');
      return cuerpo;
    },
  } as Response;
}

export class ServidorFalso {
  readonly pedidos: PedidoRecibido[] = [];
  sinConexion = false;
  /** Se pone en true si alguna vez llegó un token de refresco ya usado. */
  reusoDetectado = false;

  private readonly refrescosVigentes = new Set<string>();
  private readonly refrescosUsados = new Set<string>();
  private readonly accesosValidos = new Set<string>();
  private emitidos = 0;
  private frenoRenovacion: Promise<void> | null = null;

  /** Los tokens de acceso emitidos hasta ahora dejan de servir. */
  vencerAccesos(): void {
    this.accesosValidos.clear();
  }

  /** Cierra todas las sesiones, como si se hubieran revocado desde otro lado. */
  revocarTodo(): void {
    for (const token of this.refrescosVigentes) this.refrescosUsados.add(token);
    this.refrescosVigentes.clear();
  }

  sesionesAbiertas(): number {
    return this.refrescosVigentes.size;
  }

  /** Deja colgadas las renovaciones hasta llamar a la función que devuelve. */
  frenarRenovaciones(): () => void {
    let soltar = () => {};
    this.frenoRenovacion = new Promise((resolver) => {
      soltar = () => {
        this.frenoRenovacion = null;
        resolver();
      };
    });
    return soltar;
  }

  pedidosA(ruta: string): PedidoRecibido[] {
    return this.pedidos.filter((p) => p.ruta === ruta);
  }

  readonly fetch: PedirHttp = async (url, init) => {
    // Una vuelta de reloj, para que los pedidos simultáneos se intercalen.
    await new Promise((resolver) => setTimeout(resolver, 1));
    if (this.sinConexion) throw new TypeError('Network request failed');

    const ruta = url.replace(URL_FALSA, '');
    const cuerpo = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined;
    const autorizacion = (init.headers as Record<string, string> | undefined)?.Authorization;
    this.pedidos.push({ metodo: init.method ?? 'GET', ruta, cuerpo, autorizacion });

    switch (ruta) {
      case '/auth/google':
        return respuesta(200, { ...this.emitir(), esNuevo: true });

      case '/auth/refresh': {
        if (this.frenoRenovacion) await this.frenoRenovacion;
        const token = String(cuerpo?.refreshToken);
        if (this.refrescosVigentes.delete(token)) {
          this.refrescosUsados.add(token);
          return respuesta(200, this.emitir());
        }
        if (this.refrescosUsados.has(token)) {
          this.reusoDetectado = true;
          this.revocarTodo();
        }
        return respuesta(401, { error: 'SESION_INVALIDA' });
      }

      case '/auth/logout': {
        const token = String(cuerpo?.refreshToken);
        if (this.refrescosVigentes.delete(token)) this.refrescosUsados.add(token);
        return respuesta(204);
      }

      default: {
        const token = autorizacion?.replace('Bearer ', '');
        if (!token || !this.accesosValidos.has(token)) return respuesta(401, { error: 'TOKEN_VENCIDO' });
        return respuesta(200, { ruta });
      }
    }
  };

  private emitir() {
    this.emitidos += 1;
    const tokens = {
      accessToken: `acceso-${this.emitidos}`,
      refreshToken: `refresco-${this.emitidos}`,
      accesoExpiraEn: 900,
    };
    this.accesosValidos.add(tokens.accessToken);
    this.refrescosVigentes.add(tokens.refreshToken);
    return tokens;
  }
}

export class LlaveroEnMemoria implements Llavero {
  readonly datos = new Map<string, string>();

  getItemAsync = async (clave: string) => this.datos.get(clave) ?? null;

  setItemAsync = async (clave: string, valor: string) => {
    this.datos.set(clave, valor);
  };

  deleteItemAsync = async (clave: string) => {
    this.datos.delete(clave);
  };
}

/** Espera a que terminen los pedidos que se lanzaron sin esperar respuesta. */
export const esperarPedidosPendientes = () => new Promise((resolver) => setTimeout(resolver, 20));
