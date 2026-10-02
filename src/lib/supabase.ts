import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

/**
 * Los tokens de sesión NUNCA van a AsyncStorage (donde vive el resto de los
 * datos locales) — van al llavero cifrado del sistema operativo, vía
 * expo-secure-store. Es la misma diferencia que "escribirlo en un papel
 * arriba del escritorio" vs "guardarlo en una caja fuerte".
 */
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // no usamos el flujo de navegador
  },
});