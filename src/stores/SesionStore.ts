/**
 * SesionStore — «control» en el diagrama de clases de la aplicación móvil.
 * Mantiene el usuario autenticado, sus preferencias y sus tags
 * personalizados, y coordina el inicio y el cierre de sesión.
 */
import { useMemo } from 'react';
import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import {
  crearUsuarioNuevo,
  ErrorTag,
  Idioma,
  TagPersonalizado,
  TipoTag,
  Usuario,
  validarNombreTag,
} from '@/dominio';
import * as UsuarioLocal from '@/persistencia/UsuarioLocalRepository';
import { useRegistroStore } from './RegistroStore';

type CambiosPreferencias = Partial<Omit<Usuario, 'id'>>;

interface EstadoSesion {
  cargando: boolean;
  usuario: Usuario | null;
  tags: TagPersonalizado[];
  /** Al abrir la app recupera la sesión que haya quedado abierta (RF-03). */
  cargar: () => Promise<void>;
  iniciarSesion: (idioma: Idioma) => Promise<void>;
  actualizarPreferencias: (cambios: CambiosPreferencias) => Promise<void>;
  completarOnboarding: () => Promise<void>;
  crearTag: (nombre: string, tipo: TipoTag) => Promise<ErrorTag | null>;
  /** Eliminar un tag lo desactiva: sus valores históricos se conservan. */
  desactivarTag: (id: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

export const useSesionStore = create<EstadoSesion>((set, get) => ({
  cargando: true,
  usuario: null,
  tags: [],

  cargar: async () => {
    const usuarioId = await UsuarioLocal.obtenerSesionActiva();
    const usuario = usuarioId ? await UsuarioLocal.obtener(usuarioId) : null;
    if (usuario) await abrirSesion(usuario);
    set({ cargando: false });
  },

  // Iteración 0: crea el usuario solo en el dispositivo. En la iteración 1
  // pasa por AuthService → POST /auth/google, que verifica la identidad de
  // Google y devuelve el usuario (nuevo o existente) junto con la sesión.
  iniciarSesion: async (idioma) => {
    const usuario = crearUsuarioNuevo(Crypto.randomUUID(), idioma);
    await UsuarioLocal.guardar(usuario);
    await abrirSesion(usuario);
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

  // CU-03: los datos locales se conservan (quedan guardados bajo el id del
  // usuario). La sincronización previa y la revocación del token de refresco
  // se suman en las iteraciones 1 y 3.
  cerrarSesion: async () => {
    await UsuarioLocal.guardarSesionActiva(null);
    useRegistroStore.getState().limpiar();
    set({ usuario: null, tags: [] });
  },
}));

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
