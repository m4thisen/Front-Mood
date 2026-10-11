/**
 * Cuándo se sincroniza sola la app (CU-12, paso 1): al volver a ella, cada
 * diez minutos mientras está abierta y al recuperar la conexión (E1). Al
 * guardar el día y al abrir la app se dispara desde los stores.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { useRegistroStore } from '@/stores/RegistroStore';

const INTERVALO_MS = 10 * 60_000;

export function SincronizacionAutomatica() {
  const usuarioId = useRegistroStore((s) => s.usuarioId);

  useEffect(() => {
    if (!usuarioId) return;
    const sincronizar = () => void useRegistroStore.getState().sincronizar();

    const intervalo = setInterval(sincronizar, INTERVALO_MS);
    const app = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') sincronizar();
    });
    const red = Network.addNetworkStateListener(({ isConnected, isInternetReachable }) => {
      if (isConnected && isInternetReachable !== false) sincronizar();
    });

    return () => {
      clearInterval(intervalo);
      app.remove();
      red.remove();
    };
  }, [usuarioId]);

  return null;
}
