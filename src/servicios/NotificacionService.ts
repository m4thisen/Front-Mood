/**
 * NotificacionService — «servicio» en el diagrama de clases de la aplicación
 * móvil. El recordatorio diario es una notificación local programada en el
 * propio dispositivo: no depende del servidor ni de la conexión (CU-13).
 *
 * En lugar de una notificación que se repite sola todos los días, se
 * programan avisos sueltos para los próximos días. Así se puede saltear un
 * día que ya está registrado (CU-13, flujo A), cosa que una repetición diaria
 * no permite. La ventana se vuelve a armar al abrir la app y al guardar un
 * registro.
 */
import * as Notifications from 'expo-notifications';
import { addDays, startOfDay } from 'date-fns';
import { partesHora } from '@/dominio';
import { toISODate } from '@/utils/fecha';

/** iOS admite hasta 64 avisos programados por app; dos semanas alcanzan de sobra. */
export const DIAS_PROGRAMADOS = 14;

/** Pantalla que abre el aviso al tocarlo (CU-13, paso 5). */
export const PANTALLA_DEL_AVISO = 'Registro';

const TITULO = '¿Cómo estuvo tu día?';
const CUERPO = 'Tomate un minuto para registrarlo.';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Cuándo corresponde avisar: los próximos días a la hora elegida, salvo los
 * momentos que ya pasaron y los días que ya están registrados.
 */
export function proximosAvisos(
  hora: string,
  ahora: Date,
  diasRegistrados: Iterable<string>,
  dias = DIAS_PROGRAMADOS
): Date[] {
  const registrados = new Set(diasRegistrados);
  const { hora: horas, minuto: minutos } = partesHora(hora);
  const avisos: Date[] = [];
  for (let i = 0; i < dias; i += 1) {
    const dia = addDays(startOfDay(ahora), i);
    if (registrados.has(toISODate(dia))) continue;
    const momento = new Date(dia);
    momento.setHours(horas, minutos, 0, 0);
    if (momento > ahora) avisos.push(momento);
  }
  return avisos;
}

let enCurso: Promise<unknown> = Promise.resolve();

/**
 * Programa (o reprograma) el recordatorio a la hora "HH:mm". Devuelve false
 * si no hay permiso: la app sigue funcionando igual (CU-04 E2). El permiso
 * solo se pide cuando la persona elige la hora; al abrir la app no se la
 * interrumpe con el pedido.
 */
export function programarRecordatorio(
  hora: string,
  diasRegistrados: Iterable<string> = [],
  { pedirPermiso = true }: { pedirPermiso?: boolean } = {}
): Promise<boolean> {
  // De a una: dos reprogramaciones simultáneas podrían duplicar avisos.
  const resultado = enCurso.then(async () => {
    try {
      const { status } = pedirPermiso
        ? await Notifications.requestPermissionsAsync()
        : await Notifications.getPermissionsAsync();
      if (status !== 'granted') return false;

      await Notifications.cancelAllScheduledNotificationsAsync();
      for (const momento of proximosAvisos(hora, new Date(), diasRegistrados)) {
        await Notifications.scheduleNotificationAsync({
          content: { title: TITULO, body: CUERPO, data: { pantalla: PANTALLA_DEL_AVISO } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: momento },
        });
      }
      return true;
    } catch {
      return false;
    }
  });
  enCurso = resultado;
  return resultado;
}

export async function tienePermiso(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).status === 'granted';
}

/** Al cerrar sesión: no se recuerda nada a nadie en este teléfono. */
export function cancelar(): Promise<void> {
  const resultado = enCurso.then(() => Notifications.cancelAllScheduledNotificationsAsync());
  enCurso = resultado.catch(() => undefined);
  return resultado;
}
