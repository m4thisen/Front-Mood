/**
 * Lleva al servidor el perfil, las preferencias y los tags (CU-04 a CU-08).
 * Todo se guarda primero en el dispositivo; acá solo se anota qué falta
 * enviar y se envía cuando se puede. Sin conexión, queda pendiente para el
 * próximo intento (al abrir la app, al volver a ella o al cerrar sesión).
 */
import { ApiClient, ErrorApi } from '@/api/ApiClient';
import { aCambiosPerfil, TagApi } from '@/api/perfil';
import { TagPersonalizado, Usuario } from '@/dominio';
import type { Pendientes } from '@/persistencia/UsuarioLocalRepository';

/** Lo que se usa de la base local; en las pruebas se reemplaza. */
export interface DatosLocales {
  obtener(usuarioId: string): Promise<Usuario | null>;
  obtenerTags(usuarioId: string): Promise<TagPersonalizado[]>;
  obtenerPendientes(usuarioId: string): Promise<Pendientes>;
  guardarPendientes(usuarioId: string, pendientes: Pendientes): Promise<void>;
}

type Resultado = 'LISTO' | 'REINTENTAR';

export class PreferenciasPendientes {
  private cola: Promise<unknown> = Promise.resolve();
  private envio: Promise<void> | null = null;
  private usuarioDelEnvio: string | null = null;
  private repetir = false;

  constructor(
    private readonly api: Pick<ApiClient, 'post' | 'patch'>,
    private readonly local: DatosLocales,
    /** Si la sesión abierta sigue siendo la de esa persona: nunca se manda con el token de otra. */
    private readonly esLaSesionDe: (usuarioId: string) => boolean
  ) {}

  marcarPerfil(usuarioId: string): Promise<void> {
    return this.modificar(usuarioId, (p) => {
      p.perfil += 1;
    });
  }

  marcarTag(usuarioId: string, tagId: string): Promise<void> {
    return this.modificar(usuarioId, (p) => {
      p.tags[tagId] = (p.tags[tagId] ?? 0) + 1;
    });
  }

  async perfilPendiente(usuarioId: string): Promise<boolean> {
    return (await this.local.obtenerPendientes(usuarioId)).perfil > 0;
  }

  async tagsPendientes(usuarioId: string): Promise<string[]> {
    return Object.keys((await this.local.obtenerPendientes(usuarioId)).tags);
  }

  /**
   * Manda lo pendiente. Nunca falla: lo que no se pudo mandar queda para la
   * próxima. Si ya hay un envío en curso, al terminar se hace otra vuelta con
   * lo que haya cambiado mientras tanto.
   */
  enviar(usuarioId: string): Promise<void> {
    if (this.envio) {
      if (this.usuarioDelEnvio !== usuarioId) return this.envio.then(() => this.enviar(usuarioId));
      this.repetir = true;
      return this.envio;
    }
    this.usuarioDelEnvio = usuarioId;
    this.envio = (async () => {
      do {
        this.repetir = false;
        await this.enviarUnaVez(usuarioId).catch(() => undefined);
      } while (this.repetir);
    })().finally(() => {
      this.envio = null;
    });
    return this.envio;
  }

  private async enviarUnaVez(usuarioId: string): Promise<void> {
    const pendientes = await this.local.obtenerPendientes(usuarioId);

    if (pendientes.perfil > 0) {
      const usuario = await this.local.obtener(usuarioId);
      if (usuario) {
        const resultado = await this.intentar(usuarioId, () => this.api.patch('/usuarios/me', aCambiosPerfil(usuario)));
        if (resultado === 'REINTENTAR') return;
      }
      await this.modificar(usuarioId, (p) => {
        if (p.perfil === pendientes.perfil) p.perfil = 0;
      });
    }

    const tags = await this.local.obtenerTags(usuarioId);
    for (const [id, version] of Object.entries(pendientes.tags)) {
      const tag = tags.find((t) => t.id === id);
      if (tag) {
        const resultado = await this.intentar(usuarioId, () => this.enviarTag(tag));
        if (resultado === 'REINTENTAR') return;
      }
      await this.modificar(usuarioId, (p) => {
        if (p.tags[id] === version) delete p.tags[id];
      });
    }
  }

  /** Crear con el mismo id no duplica: si ya existía, se ajusta lo que difiera. */
  private async enviarTag(tag: TagPersonalizado): Promise<void> {
    const { id, nombre, tipo, activo } = tag;
    const enServidor = await this.api.post<TagApi>('/tags', { id, nombre, tipo });
    if (enServidor.nombre !== nombre || enServidor.activo !== activo) {
      await this.api.patch(`/tags/${id}`, { nombre, activo });
    }
  }

  private async intentar(usuarioId: string, pedido: () => Promise<unknown>): Promise<Resultado> {
    if (!this.esLaSesionDe(usuarioId)) return 'REINTENTAR';
    try {
      await pedido();
      return 'LISTO';
    } catch (error) {
      // Rechazado por el servidor (datos inválidos, nombre repetido): reintentar
      // daría siempre lo mismo, así que se descarta. Sin conexión, 401, 429 o
      // 5xx: queda para la próxima.
      if (error instanceof ErrorApi && error.estado !== null && esDefinitivo(error.estado)) {
        if (__DEV__) console.warn('El servidor rechazó un cambio de preferencias:', error.codigo);
        return 'LISTO';
      }
      return 'REINTENTAR';
    }
  }

  /** Lecturas y escrituras de pendientes, de a una, para no pisarse. */
  private modificar(usuarioId: string, cambio: (p: Pendientes) => void): Promise<void> {
    const siguiente = this.cola.then(async () => {
      const pendientes = await this.local.obtenerPendientes(usuarioId);
      cambio(pendientes);
      await this.local.guardarPendientes(usuarioId, pendientes);
    });
    this.cola = siguiente.catch(() => undefined);
    return siguiente;
  }
}

function esDefinitivo(estado: number): boolean {
  return estado >= 400 && estado < 500 && estado !== 401 && estado !== 408 && estado !== 429;
}
