/**
 * RegistroStore — «control» en el diagrama de clases de la aplicación móvil.
 * Mantiene en memoria los registros del usuario y coordina el guardado del
 * día (CU-09) y su edición (CU-11) contra la base local. Después de guardar
 * dispara la sincronización (SyncService, CU-12), sin esperarla.
 */
import { useMemo } from 'react';
import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { DatosRegistro, ErrorGuardado, esEditable, NivelAnimo, RegistroDiario, validar } from '@/dominio';
import * as RegistroLocal from '@/persistencia/RegistroLocalRepository';
import { ID_USUARIO_DEMO } from '@/datos/demo';
import { colorDelAlma, diasRegistrados, rachaActual, rachaMaxima } from '@/servicios/CalculadoraProgreso';
import { api } from '@/servicios/conexion';
import { SyncService } from '@/servicios/SyncService';
import { todayISO } from '@/utils/fecha';

interface EstadoRegistros {
  usuarioId: string | null;
  /** Registros indexados por fecha (yyyy-mm-dd). */
  registros: Record<string, RegistroDiario>;
  cargar: (usuarioId: string) => Promise<void>;
  /**
   * Guarda el registro del día para el que se abrió el formulario (por
   * defecto, hoy). Si ya existe, lo edita (CU-09, flujo B). Si ese día ya
   * terminó, no guarda nada (RN-03). Si falla la base local, lanza el error.
   */
  guardar: (datos: DatosRegistro, fecha?: string) => Promise<ErrorGuardado[]>;
  /** Edita el registro de hoy. Los días anteriores son de solo lectura (RN-03). */
  editarHoy: (datos: DatosRegistro) => Promise<ErrorGuardado[]>;
  obtenerMes: (anio: number, mes: number) => RegistroDiario[];
  /**
   * CU-12: manda lo pendiente y trae lo que falta. Silenciosa: si no hay
   * conexión, reintenta sola más tarde. La cuenta demo no tiene servidor.
   */
  sincronizar: () => Promise<void>;
  limpiar: () => void;
}

export const useRegistroStore = create<EstadoRegistros>((set, get) => ({
  usuarioId: null,
  registros: {},

  cargar: async (usuarioId) => {
    const lista = await RegistroLocal.obtenerTodos(usuarioId);
    set({ usuarioId, registros: Object.fromEntries(lista.map((r) => [r.fecha, r])) });
  },

  guardar: async (datos, fecha = todayISO()) => {
    const hoy = todayISO();
    // El formulario se abrió antes de medianoche y se guarda después.
    if (!esEditable({ fecha }, hoy)) return ['DIA_TERMINADO'];
    if (get().registros[hoy]) return get().editarHoy(datos);

    const { usuarioId } = get();
    const errores = validar(datos);
    if (errores.length > 0 || !usuarioId) return errores;

    const ahora = new Date().toISOString();
    const registro: RegistroDiario = {
      ...datos,
      nivelAnimo: datos.nivelAnimo as NivelAnimo,
      id: Crypto.randomUUID(),
      usuarioId,
      fecha: hoy,
      // RF-15: la hora de carga se registra sola y no cambia al editar.
      horaCarga: ahora,
      actualizadoEn: ahora,
      sincronizado: false,
    };
    await persistir(registro);
    return [];
  },

  editarHoy: async (datos) => {
    const existente = get().registros[todayISO()];
    const errores = validar(datos);
    if (errores.length > 0) return errores;
    if (!existente) return get().guardar(datos);

    await persistir({
      ...existente,
      ...datos,
      nivelAnimo: datos.nivelAnimo as NivelAnimo,
      actualizadoEn: new Date().toISOString(),
      sincronizado: false,
    });
    return [];
  },

  obtenerMes: (anio, mes) => {
    const prefijo = `${anio}-${String(mes + 1).padStart(2, '0')}-`;
    return Object.values(get().registros).filter((r) => r.fecha.startsWith(prefijo));
  },

  sincronizar: async () => {
    const { usuarioId } = get();
    if (!usuarioId || usuarioId === ID_USUARIO_DEMO) return;
    const resultado = await sync.sincronizar(usuarioId);
    // Lo que cambió en la base (marcas y registros nuevos) se refleja en pantalla.
    if (resultado && (resultado.enviados > 0 || resultado.recibidos > 0) && get().usuarioId === usuarioId) {
      await get().cargar(usuarioId);
    }
  },

  limpiar: () => {
    sync.detener();
    set({ usuarioId: null, registros: {} });
  },
}));

/** Primero se escribe en la base local y recién después se actualiza la pantalla. */
const sync = new SyncService(api, RegistroLocal, (usuarioId) => useRegistroStore.getState().usuarioId === usuarioId);

/**
 * Primero se escribe en la base local y recién después se actualiza la
 * pantalla; la sincronización sale después, sin esperarla (CU-09, paso 12).
 */
async function persistir(registro: RegistroDiario): Promise<void> {
  await RegistroLocal.guardar(registro);
  useRegistroStore.setState((estado) => ({
    registros: { ...estado.registros, [registro.fecha]: registro },
  }));
  void useRegistroStore.getState().sincronizar();
}

/** Todos los registros, ordenados por fecha. */
export function useListaRegistros(): RegistroDiario[] {
  const registros = useRegistroStore((s) => s.registros);
  return useMemo(
    () => Object.values(registros).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [registros]
  );
}

export function useRegistroDeHoy(): RegistroDiario | null {
  return useRegistroStore((s) => s.registros[todayISO()] ?? null);
}

/** Racha, racha máxima, días registrados y Color del Alma (CU-16). */
export function useIndicadoresProgreso() {
  const lista = useListaRegistros();
  return useMemo(
    () => ({
      rachaActual: rachaActual(lista, todayISO()),
      rachaMaxima: rachaMaxima(lista),
      diasRegistrados: diasRegistrados(lista),
      colorDelAlma: colorDelAlma(lista),
    }),
    [lista]
  );
}
