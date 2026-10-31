/**
 * DevolucionStore — «control» de "Cómo venís" (CU-21). Muestra primero la
 * última devolución guardada en el teléfono y después la que manda el
 * servidor. Se actualiza al abrir la pantalla y después de sincronizar el
 * día, que es cuando puede tocar una nueva.
 */
import { create } from 'zustand';
import { ErrorApi } from '@/api/ApiClient';
import { Devoluciones, SIN_DEVOLUCIONES } from '@/dominio';
import { devolucionesDemo, ID_USUARIO_DEMO } from '@/datos/demo';
import * as DevolucionLocal from '@/persistencia/DevolucionLocalRepository';
import { api } from '@/servicios/conexion';
import { DevolucionService } from '@/servicios/DevolucionService';

/** Si la última vez no se pudo pedir: sin conexión, o el servidor respondió con un error. */
export type EstadoPedido = 'quieto' | 'pidiendo' | 'sinConexion' | 'error';

interface EstadoDevoluciones extends Devoluciones {
  usuarioId: string | null;
  pedido: EstadoPedido;
  /** Las guardadas en el teléfono, al entrar. */
  cargar: (usuarioId: string) => Promise<void>;
  /** Pide las vigentes al servidor. Si ya hay un pedido en curso, espera ese. */
  actualizar: () => Promise<void>;
  limpiar: () => void;
}

const servicio = new DevolucionService(api, DevolucionLocal);
let enCurso: Promise<void> | null = null;

export const useDevolucionStore = create<EstadoDevoluciones>((set, get) => ({
  ...SIN_DEVOLUCIONES,
  usuarioId: null,
  pedido: 'quieto',

  cargar: async (usuarioId) => {
    if (usuarioId === ID_USUARIO_DEMO) {
      set({ ...devolucionesDemo(), usuarioId, pedido: 'quieto' });
      return;
    }
    set({ ...SIN_DEVOLUCIONES, usuarioId, pedido: 'quieto' });
    const guardadas = await servicio.guardadas(usuarioId).catch(() => SIN_DEVOLUCIONES);
    if (get().usuarioId === usuarioId) set(guardadas);
  },

  actualizar: () => {
    const { usuarioId } = get();
    // La cuenta demo no tiene servidor.
    if (!usuarioId || usuarioId === ID_USUARIO_DEMO) return Promise.resolve();
    enCurso ??= (async () => {
      set({ pedido: 'pidiendo' });
      try {
        const actuales = await servicio.pedir(usuarioId);
        if (get().usuarioId === usuarioId) set({ ...actuales, pedido: 'quieto' });
      } catch (error) {
        if (get().usuarioId !== usuarioId) return;
        set({ pedido: error instanceof ErrorApi && error.codigo === 'SIN_CONEXION' ? 'sinConexion' : 'error' });
      } finally {
        enCurso = null;
      }
    })();
    return enCurso;
  },

  limpiar: () => set({ ...SIN_DEVOLUCIONES, usuarioId: null, pedido: 'quieto' }),
}));
