import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

GoogleSignin.configure({
  webClientId: Constants.expoConfig?.extra?.googleWebClientId as string,
  offlineAccess: false,
});

/**
 * Login (y registro, es el mismo paso) con Google.
 *
 * Google nunca comparte la contraseña del usuario con nuestra app. Lo que
 * recibimos acá es un "ID token": un documento firmado digitalmente por
 * Google que certifica el mail de la persona. Se lo pasamos a Supabase, que
 * valida esa firma contra las claves públicas de Google antes de crear la
 * sesión — nuestra app nunca decide por sí sola que el login es válido.
 *
 * Devuelve la sesión si salió bien, o null si el usuario cerró la ventana
 * de Google sin elegir ninguna cuenta.
 */
export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    return null;
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error('Google no devolvió un ID token.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) throw error;
  return data.session;
}

export async function signOutGoogle() {
  await supabase.auth.signOut();
  try {
    await GoogleSignin.signOut();
  } catch {
    // Ya estaba desconectado del lado de Google, no pasa nada.
  }
}