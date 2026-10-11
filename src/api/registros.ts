/**
 * Forma en que viaja un registro por /sync (CU-12): la entidad de la app sin
 * usuarioId (el servidor toma a la persona del token) ni la marca local de
 * sincronizado.
 */
import { RegistroDiario } from '@/dominio';

export type RegistroApi = Omit<RegistroDiario, 'usuarioId' | 'sincronizado'>;

export interface PedidoSync {
  cursor: string | null;
  registros: RegistroApi[];
}

export interface RespuestaSync {
  aceptados: string[];
  rechazados: { id: string; motivo: string }[];
  cambios: RegistroApi[];
  nuevoCursor: string | null;
  hayMas: boolean;
}

export function aRegistroApi(registro: RegistroDiario): RegistroApi {
  const { usuarioId: _usuarioId, sincronizado: _sincronizado, ...resto } = registro;
  return resto;
}

export function deRegistroApi(registro: RegistroApi, usuarioId: string): RegistroDiario {
  return { ...registro, usuarioId, sincronizado: true };
}
