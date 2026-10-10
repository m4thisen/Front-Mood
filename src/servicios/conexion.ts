/**
 * Arma y conecta las piezas del diagrama de clases que hablan con el
 * servidor: ApiClient pide los tokens a AuthService, y AuthService usa
 * ApiClient para las rutas de sesión.
 */
import { ApiClient } from '@/api/ApiClient';
import { zonaHorariaDelDispositivo } from '@/dominio';
import { AlmacenSeguro } from '@/persistencia/AlmacenSeguro';
import { AuthService, ProveedorIdentidad } from './AuthService';
import { identidadGoogle } from './IdentidadGoogle';
import { identidadSimulada } from './IdentidadSimulada';

/**
 * EXPO_PUBLIC_API_URL viaja dentro de la app: no es un secreto. En el
 * simulador de iOS, localhost es la propia compu.
 */
function urlApi(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (url) {
    if (!__DEV__ && !url.startsWith('https://')) throw new Error('En producción la API tiene que usar https.');
    return url.replace(/\/$/, '');
  }
  if (__DEV__) return 'http://localhost:3000';
  throw new Error('Falta EXPO_PUBLIC_API_URL.');
}

export const api: ApiClient = new ApiClient(urlApi(), {
  tokenAcceso: () => authService.tokenAcceso(),
  renovar: (tokenVencido) => authService.renovar(tokenVencido),
});

export const authService: AuthService = new AuthService(api, new AlmacenSeguro(), identidadGoogle, zonaHorariaDelDispositivo);

/** Solo en desarrollo: entrar con varias cuentas sin una de Google para cada una. */
export const cuentaDePrueba: ProveedorIdentidad | null = __DEV__ ? identidadSimulada : null;
