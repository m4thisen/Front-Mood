/** Preferencias de interfaz propias de este dispositivo (no se sincronizan). */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLAVES } from './claves';

export async function coachmarkHoyVisto(): Promise<boolean> {
  return (await AsyncStorage.getItem(CLAVES.coachmarkHoyVisto)) !== null;
}

export async function marcarCoachmarkHoyVisto(): Promise<void> {
  await AsyncStorage.setItem(CLAVES.coachmarkHoyVisto, '1');
}

/** Si el recordatorio llegó a tener permiso en este dispositivo (CU-13, E1). */
export async function recordatorioPermitido(): Promise<boolean> {
  return (await AsyncStorage.getItem(CLAVES.recordatorioPermitido)) === '1';
}

export async function guardarRecordatorioPermitido(permitido: boolean): Promise<void> {
  if (permitido) await AsyncStorage.setItem(CLAVES.recordatorioPermitido, '1');
  else await AsyncStorage.removeItem(CLAVES.recordatorioPermitido);
}
