/**
 * NotificacionService — «servicio» en el diagrama de clases de la aplicación
 * móvil. El recordatorio diario es una notificación local programada en el
 * propio dispositivo: no depende del servidor ni de la conexión (CU-13).
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { partesHora } from '@/dominio';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Programa (o reprograma) el recordatorio a la hora "HH:mm". Devuelve false
 * si el usuario no dio permiso: la app sigue funcionando igual (CU-04 E2).
 */
export async function programarRecordatorio(hora: string, titulo: string, cuerpo: string): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('recordatorio-diario', {
        name: 'Recordatorio diario',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await cancelar();
    const { hora: hour, minuto: minute } = partesHora(hora);
    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: cuerpo },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'recordatorio-diario',
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelar(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
