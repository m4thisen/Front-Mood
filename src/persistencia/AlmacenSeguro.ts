/**
 * AlmacenSeguro — «repositorio» en el diagrama de clases de la aplicación
 * móvil. Guarda los tokens de la sesión en el llavero del sistema (Keychain en
 * iOS, Keystore en Android), nunca en AsyncStorage.
 *
 * Solo en este dispositivo: no viajan en las copias de seguridad ni a otro
 * teléfono. Se pueden leer con el teléfono bloqueado después del primer
 * desbloqueo, para la sincronización en segundo plano (iteración 3).
 */
import * as SecureStore from 'expo-secure-store';

export interface TokensGuardados {
  accessToken: string;
  refreshToken: string;
}

/** Lo que se usa de expo-secure-store; en las pruebas se reemplaza. */
export type Llavero = Pick<typeof SecureStore, 'getItemAsync' | 'setItemAsync' | 'deleteItemAsync'>;

const CLAVE = 'mood.sesion';
const OPCIONES: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export class AlmacenSeguro {
  constructor(private readonly llavero: Llavero = SecureStore) {}

  async guardarTokens(tokens: TokensGuardados): Promise<void> {
    const { accessToken, refreshToken } = tokens;
    await this.llavero.setItemAsync(CLAVE, JSON.stringify({ accessToken, refreshToken }), OPCIONES);
  }

  async leerTokens(): Promise<TokensGuardados | null> {
    const crudo = await this.llavero.getItemAsync(CLAVE, OPCIONES);
    if (!crudo) return null;
    try {
      const tokens = JSON.parse(crudo) as Partial<TokensGuardados>;
      if (typeof tokens.accessToken === 'string' && typeof tokens.refreshToken === 'string') {
        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
      }
    } catch {
      // Contenido corrupto: es como no tener sesión.
    }
    return null;
  }

  async borrar(): Promise<void> {
    await this.llavero.deleteItemAsync(CLAVE, OPCIONES);
  }
}
