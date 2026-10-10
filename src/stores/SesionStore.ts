/**
 * SesionStore — «control» en el diagrama de clases de la aplicación móvil.
 * Mantiene el usuario autenticado, sus preferencias y sus tags
 * personalizados, y coordina el inicio y el cierre de sesión.
 *
 * La sesión se abre contra el servidor (AuthService), pero después la app
 * funciona con lo guardado en el dispositivo: abrirla no necesita conexión.
 */
import { useMemo } from 'react';
import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { ErrorTag, Idioma, TagPersonalizado, TipoTag, Usuario, validarNombreTag } from '@/dominio';
import { ErrorApi } from '@/api/ApiClient';
import { aTag, aUsuario, PerfilApi, TagApi } from '@/api/perfil';
import * as UsuarioLocal from '@/persistencia/UsuarioLocalRepository';
import { api, authService, cuentaDePrueba } from '@/servicios/conexion';
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
  /** Eliminar un tag lo desactiva: sus valores históricos se conservan. */
  desactivarTag: (id: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
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
      const [perfil, tags] = await Promise.all([api.get<PerfilApi>('/usuarios/me'), api.get<TagApi[]>('/tags')]);
      const usuario = aUsuario(perfil);
      await UsuarioLocal.guardar(usuario);
      await UsuarioLocal.guardarTags(usuario.id, tags.map(aTag));
      await abrirSesion(usuario);
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
  },

  completarOnboarding: async () => {
    await get().actualizarPreferencias({ onboardingCompleto: true });
  },

  crearTag: async (nombre, tipo) => {
    const { usuario, tags } = get();
    if (!usuario) return null;
    const error = validarNombreTag(nombre, tags);
    if (error) return error;

    const nuevos = [...tags, { id: Crypto.randomUUID(), nombre: nombre.trim(), tipo, activo: true }];
    await UsuarioLocal.guardarTags(usuario.id, nuevos);
    set({ tags: nuevos });
    return null;
  },

  desactivarTag: async (id) => {
    const { usuario, tags } = get();
    if (!usuario) return;
    const nuevos = tags.map((t) => (t.id === id ? { ...t, activo: false } : t));
    await UsuarioLocal.guardarTags(usuario.id, nuevos);
    set({ tags: nuevos });
  },

  // CU-03: revoca la sesión en el servidor y conserva los datos locales
  // (quedan guardados bajo el id del usuario). La sincronización previa se
  // suma en la iteración 3.
  cerrarSesion: async () => {
    await authService.cerrarSesion();
    await cerrarLocal();
  },

  entrarConCuentaDemo: async (idioma) => {
    await cargarCuentaDemo(idioma);
    await get().cargar();
  },
}));

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
