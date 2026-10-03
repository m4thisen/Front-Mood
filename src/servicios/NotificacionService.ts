import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Programa (o reprograma) el recordatorio diario a la hora elegida.
 * Best-effort: si el usuario no da permisos, no rompe el flujo de la app.
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  title: string,
  body: string
): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-reminder', {
        name: 'Recordatorio diario',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return true;
  } catch {
    return false;
  }
}
