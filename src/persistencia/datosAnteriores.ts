/**
 * Al pasar a SQLite (iteración 2) se decidió arrancar limpio en lugar de
 * migrar: el perfil y los tags vuelven del servidor al entrar. Esto borra lo
 * que quedó en AsyncStorage, para no dejar datos personales sueltos en el
 * teléfono. Si no queda nada, no hace nada.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLAVES_ANTERIORES } from './claves';

export async function borrarDatosAnteriores(): Promise<void> {
  const claves = (await AsyncStorage.getAllKeys()).filter(
    (clave) => clave === CLAVES_ANTERIORES.sesionActiva || clave.startsWith(CLAVES_ANTERIORES.prefijoUsuarios)
  );
  if (claves.length > 0) await AsyncStorage.multiRemove(claves);
}
