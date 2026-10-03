/**
 * Respuesta táctil, con el mismo criterio que iOS: un "tic" al elegir una
 * opción, un toque al apretar un botón y una vibración de éxito al guardar.
 * Si el dispositivo no lo soporta, no pasa nada.
 */
import * as Haptics from 'expo-haptics';

const sinErrores = (promesa: Promise<void>) => promesa.catch(() => undefined);

export const hapticos = {
  seleccion: () => sinErrores(Haptics.selectionAsync()),
  toque: () => sinErrores(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  exito: () => sinErrores(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => sinErrores(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
