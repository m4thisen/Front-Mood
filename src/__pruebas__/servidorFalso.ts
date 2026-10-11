/**
 * Servidor de mentira para probar ApiClient y AuthService sin red, con las
 * mismas reglas de sesión que el real: el token de refresco rota en cada uso
 * y, si aparece uno ya usado, se cierran todas las sesiones.
 */
import type { PedirHttp } from '@/api/ApiClient';
import type { RegistroApi } from '@/api/registros';
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

interface TagGuardado {
  id: string;
  nombre: string;
  tipo: string;
  activo: boolean;
}

export class ServidorFalso {
  readonly pedidos: PedidoRecibido[] = [];
  sinConexion = false;
  /** Último perfil recibido por PATCH /usuarios/me. */
  perfil: Record<string, unknown> = {};
  readonly tags = new Map<string, TagGuardado>();
  /** Respuestas de error forzadas, por "MÉTODO /ruta". */
  readonly fallas = new Map<string, { estado: number; error: string }>();
  /** Registros en la nube, con el orden en que se guardaron (hace de cursor). */
  readonly registros = new Map<string, { registro: RegistroApi; orden: number }>();
  /** Ids que /sync rechaza por datos inválidos (E3). */
  readonly rechazarIds = new Set<string>();
  cambiosPorPagina = 100;
  private ordenSync = 0;
  /** Se pone en true si alguna vez llegó un token de refresco ya usado. */
  reusoDetectado = false;

  private readonly refrescosVigentes = new Set<string>();
  private readonly refrescosUsados = new Set<string>();
  private readonly accesosValidos = new Set<string>();
  private emitidos = 0;
  private frenoRenovacion: Promise<void> | null = null;
  private frenoPedidos: Promise<void> | null = null;

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

  /** Deja colgados los pedidos con sesión hasta llamar a la función que devuelve. */
  frenarPedidos(): () => void {
    let soltar = () => {};
    this.frenoPedidos = new Promise((resolver) => {
      soltar = () => {
        this.frenoPedidos = null;
        resolver();
      };
    });
    return soltar;
  }

  /** Abre una sesión sin pasar por /auth/google y devuelve su token de acceso. */
  abrirSesion(): { accessToken: string; refreshToken: string } {
    return this.emitir();
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
        if (this.frenoPedidos) await this.frenoPedidos;
        const metodo = init.method ?? 'GET';
        const falla = this.fallas.get(`${metodo} ${ruta}`);
        if (falla) return respuesta(falla.estado, { error: falla.error });
        return this.conSesion(metodo, ruta, cuerpo ?? {});
      }
    }
  };

  /** Perfil y tags, con las mismas reglas que el servidor real. */
  /** Carga un registro como si lo hubiera subido otro teléfono. */
  guardarRegistro(registro: RegistroApi): void {
    this.ordenSync += 1;
    this.registros.set(registro.id, { registro, orden: this.ordenSync });
  }

  /** /sync con las mismas reglas que el real: gana la última edición, un registro por fecha. */
  private sincronizar(cuerpo: Record<string, unknown>): Response {
    const enviados = cuerpo.registros as RegistroApi[];
    const aceptados: string[] = [];
    const rechazados: { id: string; motivo: string }[] = [];
    const iguales = new Set<string>();
    const aDevolver: string[] = [];
    this.ordenSync += 1;
    const orden = this.ordenSync;

    for (const r of enviados) {
      if (this.rechazarIds.has(r.id)) {
        rechazados.push({ id: r.id, motivo: 'DATOS_INVALIDOS' });
        continue;
      }
      aceptados.push(r.id);
      const existente =
        this.registros.get(r.id) ?? [...this.registros.values()].find((x) => x.registro.fecha === r.fecha);
      if (!existente) {
        this.registros.set(r.id, { registro: r, orden });
        iguales.add(r.id);
      } else if (Date.parse(r.actualizadoEn) > Date.parse(existente.registro.actualizadoEn)) {
        const id = existente.registro.id;
        this.registros.set(id, { registro: { ...r, id }, orden });
        if (id === r.id) iguales.add(r.id);
      } else if (existente.registro.id === r.id && existente.registro.actualizadoEn === r.actualizadoEn) {
        iguales.add(r.id);
      } else {
        aDevolver.push(existente.registro.id);
      }
    }

    const desde = cuerpo.cursor === null ? 0 : Number(cuerpo.cursor);
    const posteriores = [...this.registros.values()].filter((x) => x.orden > desde).sort((a, b) => a.orden - b.orden);
    const pagina = posteriores.slice(0, this.cambiosPorPagina);
    const extra = aDevolver.map((id) => this.registros.get(id)!).filter((x) => !pagina.includes(x));
    return respuesta(200, {
      aceptados,
      rechazados,
      cambios: [...pagina, ...extra].map((x) => x.registro).filter((r) => !iguales.has(r.id)),
      nuevoCursor: pagina.length ? String(pagina.at(-1)!.orden) : (cuerpo.cursor ?? null),
      hayMas: posteriores.length > this.cambiosPorPagina,
    });
  }

  private conSesion(metodo: string, ruta: string, cuerpo: Record<string, unknown>): Response {
    if (metodo === 'POST' && ruta === '/sync') return this.sincronizar(cuerpo);
    if (metodo === 'PATCH' && ruta === '/usuarios/me') {
      this.perfil = { ...this.perfil, ...cuerpo };
      return respuesta(200, this.perfil);
    }
    if (metodo === 'POST' && ruta === '/tags') {
      const id = String(cuerpo.id);
      const existente = this.tags.get(id);
      if (existente) return respuesta(201, existente);
      if (this.nombreOcupado(String(cuerpo.nombre))) return respuesta(409, { error: 'NOMBRE_REPETIDO' });
      const tag = { id, nombre: String(cuerpo.nombre), tipo: String(cuerpo.tipo), activo: true };
      this.tags.set(id, tag);
      return respuesta(201, tag);
    }
    const editar = /^\/tags\/(.+)$/.exec(ruta);
    if (metodo === 'PATCH' && editar) {
      const tag = this.tags.get(editar[1]);
      if (!tag) return respuesta(404, { error: 'NO_ENCONTRADO' });
      const actualizado = { ...tag, ...cuerpo } as TagGuardado;
      if (actualizado.activo && this.nombreOcupado(actualizado.nombre, tag.id)) {
        return respuesta(409, { error: 'NOMBRE_REPETIDO' });
      }
      this.tags.set(tag.id, actualizado);
      return respuesta(200, actualizado);
    }
    return respuesta(200, { ruta });
  }

  private nombreOcupado(nombre: string, salvoId?: string): boolean {
    return [...this.tags.values()].some(
      (t) => t.activo && t.id !== salvoId && t.nombre.toLowerCase() === nombre.toLowerCase()
    );
  }

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
