/** Preferencias de interfaz propias de este dispositivo (no se sincronizan). */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLAVES } from './claves';

export async function coachmarkHoyVisto(): Promise<boolean> {
  return (await AsyncStorage.getItem(CLAVES.coachmarkHoyVisto)) !== null;
}

export async function marcarCoachmarkHoyVisto(): Promise<void> {
  await AsyncStorage.setItem(CLAVES.coachmarkHoyVisto, '1');
}
