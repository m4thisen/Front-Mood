/**
 * Identidad de Google (CU-01, CU-02), con la librería gratuita
 * @react-native-google-signin/google-signin. La app solo consigue el
 * idToken y se lo pasa al servidor: quien lo verifica es el servidor.
 *
 * Los client IDs no son secretos: viajan dentro de toda app que entra con
 * Google. El de iOS, invertido, es el iosUrlScheme de app.json: si cambia
 * uno, cambia el otro.
 */
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { ProveedorIdentidad } from './AuthService';

const ID_CLIENTE_IOS = '64652794829-k11tg09m1soe0cq626883mrp5f5hqcrl.apps.googleusercontent.com';
/** El del servidor: con él, el idToken sale dirigido a nuestro servidor. */
const ID_CLIENTE_WEB = '64652794829-tdvuemuaq2tm57horsk63jgv8b0s4rk1.apps.googleusercontent.com';

let configurado = false;

function configurar(): void {
  if (configurado) return;
  // Sin scopes extra: alcanza con la identidad (nombre y email).
  GoogleSignin.configure({ iosClientId: ID_CLIENTE_IOS, webClientId: ID_CLIENTE_WEB });
  configurado = true;
}

export const identidadGoogle: ProveedorIdentidad = {
  async obtenerIdToken() {
    configurar();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true }); // Android; en iOS no hace nada
    const respuesta = await GoogleSignin.signIn();
    if (!isSuccessResponse(respuesta)) return null; // la persona canceló
    if (!respuesta.data.idToken) throw new Error('Google no devolvió el idToken.');
    return respuesta.data.idToken;
  },

  /** Para que la próxima vez se pueda elegir otra cuenta. */
  async cerrar() {
    configurar();
    await GoogleSignin.signOut();
  },
};
