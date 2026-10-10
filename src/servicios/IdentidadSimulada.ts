/**
 * Cuentas de prueba, solo para desarrollo: para entrar con varias cuentas sin
 * tener una de Google para cada una. El servidor las acepta únicamente con
 * CUENTAS_DE_PRUEBA=true, que no puede usarse en producción.
 *
 * Pide un email y arma "simulado:<usuario>:<email>": el mismo email entra
 * siempre a la misma cuenta, así se prueban CU-01 (nueva) y CU-02 (existente).
 */
import { Alert, Platform } from 'react-native';
import { ProveedorIdentidad } from './AuthService';

const EMAIL_POR_DEFECTO = 'lucia@ejemplo.com';

export function tokenSimulado(email: string): string | null {
  const limpio = email.trim().toLowerCase();
  if (!/^[^\s:@]+@[^\s:@]+\.[a-z]{2,}$/.test(limpio)) return null;
  const usuario = limpio.split('@')[0].replace(/[^\w.-]/g, '-').padEnd(3, '_').slice(0, 64);
  return `simulado:${usuario}:${limpio}`;
}

export const identidadSimulada: ProveedorIdentidad = {
  obtenerIdToken: () => {
    if (!__DEV__) throw new Error('La identidad simulada solo existe en desarrollo.');
    // Alert.prompt solo existe en iOS; en Android entra siempre con el mismo email.
    if (Platform.OS !== 'ios') return Promise.resolve(tokenSimulado(EMAIL_POR_DEFECTO));

    return new Promise((resolver) => {
      Alert.prompt(
        'Cuenta de prueba',
        'Escribí cualquier email. El mismo email entra siempre a la misma cuenta.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolver(null) },
          { text: 'Entrar', onPress: (email?: string) => resolver(tokenSimulado(email ?? '')) },
        ],
        'plain-text',
        EMAIL_POR_DEFECTO,
        'email-address'
      );
    });
  },
};
