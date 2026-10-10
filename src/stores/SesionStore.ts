/**
 * SesionStore — «control» en el diagrama de clases de la aplicación móvil.
 * Mantiene el usuario autenticado, sus preferencias y sus tags
 * personalizados, y coordina el inicio y el cierre de sesión.
 *
 * La sesión se abre contra el servidor (AuthService), pero después la app
 * funciona con lo guardado en el dispositivo: abrirla no necesita conexión.
 * Cada cambio de perfil, preferencias o tags se guarda primero acá y después
 * se manda al servidor (PreferenciasPendientes), como en CU-04.
 */
import { useMemo } from 'react';
import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { ErrorTag, Idioma, TagPersonalizado, TipoTag, Usuario, validarNombreTag } from '@/dominio';
import { ErrorApi } from '@/api/ApiClient';
import { aTag, aUsuario, PerfilApi, TagApi } from '@/api/perfil';
import * as UsuarioLocal from '@/persistencia/UsuarioLocalRepository';
import { api, authService, cuentaDePrueba } from '@/servicios/conexion';
import { PreferenciasPendientes } from '@/servicios/PreferenciasPendientes';
import { useRegistroStore } from './RegistroStore';
import { cargarCuentaDemo, ID_USUARIO_DEMO } from '@/datos/demo';

/** Por qué no se pudo entrar. */
export type ErrorIngreso = 'SIN_CONEXION' | 'DEMASIADOS_INTENTOS' | 'NO_SE_PUDO';

type CambiosPreferencias = Partial<Omit<Usuario, 'id'>>;

interface EstadoSesion {
  cargando: boolean;
  usuario: Usuario | null;
  tags: TagPersonalizado[];
  /** La sesión se cerró sola (venció o se revocó): la bienvenida lo avisa. */
  sesionVencida: boolean;
  /** Al abrir la app recupera la sesión que haya quedado abierta (RF-03). */
  cargar: () => Promise<void>;
  /**
   * CU-01 y CU-02. Devuelve null si entró o si la persona canceló. En
   * desarrollo se puede entrar con una cuenta de prueba en lugar de Google.
   */
  iniciarSesion: (idioma: Idioma, conCuentaDePrueba?: boolean) => Promise<ErrorIngreso | null>;
  actualizarPreferencias: (cambios: CambiosPreferencias) => Promise<void>;
  completarOnboarding: () => Promise<void>;
  crearTag: (nombre: string, tipo: TipoTag) => Promise<ErrorTag | null>;
  /** El tipo no se cambia: rompería los valores ya cargados. */
  renombrarTag: (id: string, nombre: string) => Promise<ErrorTag | null>;
  /** Eliminar un tag lo desactiva: sus valores históricos se conservan. */
  desactivarTag: (id: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  /** Reintenta mandar al servidor lo que haya quedado pendiente. */
  sincronizarPreferencias: () => Promise<void>;
  /** Solo en desarrollo: entra con la cuenta de demostración. */
  entrarConCuentaDemo: (idioma: Idioma) => Promise<void>;
}

export const useSesionStore = create<EstadoSesion>((set, get) => ({
  cargando: true,
  usuario: null,
  tags: [],
  sesionVencida: false,

  cargar: async () => {
    const usuarioId = await UsuarioLocal.obtenerSesionActiva();
    const usuario = usuarioId ? await UsuarioLocal.obtener(usuarioId) : null;
    // La cuenta demo no tiene sesión en el servidor; las demás necesitan sus tokens.
    if (usuario && (usuario.id === ID_USUARIO_DEMO || (await authService.haySesion()))) {
      await abrirSesion(usuario);
      void get().sincronizarPreferencias();
    } else {
      // Restos de una sesión: un usuario sin tokens (de la iteración 0) o tokens
      // sin usuario (el llavero de iOS sobrevive a reinstalar la app).
      await UsuarioLocal.guardarSesionActiva(null);
      await authService.cerrarSesion();
    }
    set({ cargando: false });
  },

  iniciarSesion: async (idioma, conCuentaDePrueba = false) => {
    set({ sesionVencida: false });
    try {
      const identidad = conCuentaDePrueba && cuentaDePrueba ? cuentaDePrueba : undefined;
      const ingreso = await authService.ingresarConGoogle(idioma, identidad);
      if (!ingreso) return null;

      // CU-02: el perfil y los tags vienen del servidor (en una cuenta nueva, vacíos).
      const [perfil, tagsApi] = await Promise.all([api.get<PerfilApi>('/usuarios/me'), api.get<TagApi[]>('/tags')]);
      const { usuario, tags } = await conPendientesLocales(aUsuario(perfil), tagsApi.map(aTag));
      await UsuarioLocal.guardar(usuario);
      await UsuarioLocal.guardarTags(usuario.id, tags);
      await abrirSesion(usuario);
      void get().sincronizarPreferencias();
      return null;
    } catch (error) {
      // Si entró pero no pudo bajar el perfil, no queda una sesión a medias.
      await authService.cerrarSesion();
      return errorDeIngreso(error);
    }
  },

  actualizarPreferencias: async (cambios) => {
    const actual = get().usuario;
    if (!actual) return;
    const usuario = { ...actual, ...cambios };
    await UsuarioLocal.guardar(usuario);
    set({ usuario });
    await paraElServidor(usuario.id, (id) => preferencias.marcarPerfil(id));
  },

  completarOnboarding: async () => {
    await get().actualizarPreferencias({ onboardingCompleto: true });
  },

  crearTag: async (nombre, tipo) => {
    const { usuario, tags } = get();
    if (!usuario) return null;
    const error = validarNombreTag(nombre, tags);
    if (error) return error;

    // El id nace en el dispositivo: así el tag existe aunque no haya conexión.
    const tag = { id: Crypto.randomUUID(), nombre: nombre.trim(), tipo, activo: true };
    const nuevos = [...tags, tag];
    await UsuarioLocal.guardarTags(usuario.id, nuevos);
    set({ tags: nuevos });
    await paraElServidor(usuario.id, (usuarioId) => preferencias.marcarTag(usuarioId, tag.id));
    return null;
  },

  renombrarTag: async (id, nombre) => {
    const { usuario, tags } = get();
    if (!usuario) return null;
    const error = validarNombreTag(nombre, tags, id);
    if (error) return error;

    const limpio = nombre.trim();
    if (tags.find((t) => t.id === id)?.nombre === limpio) return null;
    const nuevos = tags.map((t) => (t.id === id ? { ...t, nombre: limpio } : t));
    await UsuarioLocal.guardarTags(usuario.id, nuevos);
    set({ tags: nuevos });
    await paraElServidor(usuario.id, (usuarioId) => preferencias.marcarTag(usuarioId, id));
    return null;
  },

  desactivarTag: async (id) => {
    const { usuario, tags } = get();
    if (!usuario) return;
    const nuevos = tags.map((t) => (t.id === id ? { ...t, activo: false } : t));
    await UsuarioLocal.guardarTags(usuario.id, nuevos);
    set({ tags: nuevos });
    await paraElServidor(usuario.id, (usuarioId) => preferencias.marcarTag(usuarioId, id));
  },

  // CU-03: antes de revocar la sesión intenta mandar lo pendiente. Los datos
  // locales se conservan bajo el id del usuario: si no hubo conexión, se
  // mandan la próxima vez que entre. La sincronización de los registros se
  // suma en la iteración 3.
  cerrarSesion: async () => {
    const usuario = get().usuario;
    if (usuario && usuario.id !== ID_USUARIO_DEMO) {
      await Promise.race([preferencias.enviar(usuario.id), esperar(LIMITE_ENVIO_AL_SALIR_MS)]);
    }
    await authService.cerrarSesion();
    await cerrarLocal();
  },

  sincronizarPreferencias: async () => {
    const usuario = get().usuario;
    if (usuario && usuario.id !== ID_USUARIO_DEMO) await preferencias.enviar(usuario.id);
  },

  entrarConCuentaDemo: async (idioma) => {
    await cargarCuentaDemo(idioma);
    await get().cargar();
  },
}));

const LIMITE_ENVIO_AL_SALIR_MS = 5_000;

const preferencias = new PreferenciasPendientes(
  api,
  UsuarioLocal,
  (usuarioId) => useSesionStore.getState().usuario?.id === usuarioId
);

/** Anota el cambio y lo intenta mandar ya, sin esperar. La cuenta demo no tiene servidor. */
async function paraElServidor(usuarioId: string, anotar: (usuarioId: string) => Promise<void>): Promise<void> {
  if (usuarioId === ID_USUARIO_DEMO) return;
  await anotar(usuarioId);
  void preferencias.enviar(usuarioId);
}

/**
 * Al entrar, el perfil del servidor manda, salvo que en este teléfono hayan
 * quedado cambios sin enviar de esta misma cuenta: esos ganan y se mandan.
 */
async function conPendientesLocales(
  delServidor: Usuario,
  tagsDelServidor: TagPersonalizado[]
): Promise<{ usuario: Usuario; tags: TagPersonalizado[] }> {
  const id = delServidor.id;
  const local = await UsuarioLocal.obtener(id);
  const usuario = local && (await preferencias.perfilPendiente(id)) ? local : delServidor;

  const pendientes = new Set(await preferencias.tagsPendientes(id));
  if (pendientes.size === 0) return { usuario, tags: tagsDelServidor };
  const tagsLocales = (await UsuarioLocal.obtenerTags(id)).filter((t) => pendientes.has(t.id));
  return { usuario, tags: [...tagsDelServidor.filter((t) => !pendientes.has(t.id)), ...tagsLocales] };
}

const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

// El servidor dio la sesión por terminada: se vuelve a la bienvenida con un aviso.
authService.alPerderSesion(() => {
  void cerrarLocal().then(() => useSesionStore.setState({ sesionVencida: true }));
});

async function cerrarLocal(): Promise<void> {
  await UsuarioLocal.guardarSesionActiva(null);
  useRegistroStore.getState().limpiar();
  useSesionStore.setState({ usuario: null, tags: [] });
}

function errorDeIngreso(error: unknown): ErrorIngreso {
  if (error instanceof ErrorApi) {
    if (error.codigo === 'SIN_CONEXION') return 'SIN_CONEXION';
    if (error.codigo === 'DEMASIADOS_PEDIDOS') return 'DEMASIADOS_INTENTOS';
  }
  if (__DEV__) console.warn('No se pudo entrar:', error);
  return 'NO_SE_PUDO';
}

async function abrirSesion(usuario: Usuario): Promise<void> {
  const tags = await UsuarioLocal.obtenerTags(usuario.id);
  await UsuarioLocal.guardarSesionActiva(usuario.id);
  await useRegistroStore.getState().cargar(usuario.id);
  useSesionStore.setState({ usuario, tags });
}

/** Tags que se muestran en el formulario de "Hoy" y en Mi cuenta. */
export function useTagsActivos(): TagPersonalizado[] {
  const tags = useSesionStore((s) => s.tags);
  return useMemo(() => tags.filter((t) => t.activo), [tags]);
}
