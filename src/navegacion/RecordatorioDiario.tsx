/**
 * Lo que el recordatorio diario (CU-13) necesita de la navegación: abrir el
 * formulario al tocar el aviso y avisar si se quitó el permiso.
 */
import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PANTALLA_DEL_AVISO } from '@/servicios/NotificacionService';
import { useSesionStore } from '@/stores/SesionStore';
import { navegacion } from './referencia';

/**
 * CU-13, paso 5: tocar el aviso abre directo el formulario del día, tanto con
 * la app abierta como cerrada. Si todavía no hay sesión, espera a que la haya.
 */
export function AbrirDesdeRecordatorio({ navegacionLista }: { navegacionLista: boolean }) {
  const respuesta = Notifications.useLastNotificationResponse();
  const puedeRegistrar = useSesionStore((s) => s.usuario?.onboardingCompleto === true);

  useEffect(() => {
    const pantalla = respuesta?.notification.request.content.data?.pantalla;
    if (!navegacionLista || !puedeRegistrar || pantalla !== PANTALLA_DEL_AVISO) return;
    navegacion.navigate('Principal', { screen: 'Registro' });
    Notifications.clearLastNotificationResponse();
  }, [respuesta, navegacionLista, puedeRegistrar]);

  return null;
}

/** CU-13, E1: si se quitó el permiso, se avisa la próxima vez que se abre la app. */
export function AvisoPermisoRecordatorio() {
  const sinPermiso = useSesionStore((s) => s.recordatorioSinPermiso);
  const descartar = useSesionStore((s) => s.descartarAvisoPermiso);

  useEffect(() => {
    if (!sinPermiso) return;
    Alert.alert(
      'El recordatorio está apagado',
      'Se quitó el permiso de notificaciones, así que el recordatorio diario no va a sonar. Podés volver a activarlo desde Ajustes.',
      [
        { text: 'Ahora no', style: 'cancel', onPress: descartar },
        {
          text: 'Abrir Ajustes',
          onPress: () => {
            descartar();
            void Linking.openSettings();
          },
        },
      ]
    );
  }, [sinPermiso, descartar]);

  return null;
}
