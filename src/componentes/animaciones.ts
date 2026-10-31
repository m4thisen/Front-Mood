/**
 * Las animaciones de entrada de la app, todas del mismo estilo: suaves,
 * cortas y escalonadas, como en iOS. Si el teléfono tiene activado "Reducir
 * movimiento", Reanimated las saltea (ReduceMotion.System).
 */
import { Easing, FadeIn, FadeInDown, FadeOut, ReduceMotion, withDelay, withTiming } from 'react-native-reanimated';

/** Lo que aparece en una pantalla, de arriba hacia abajo: cada bloque un poco después del anterior. */
export const entrada = (orden = 0) => FadeInDown.duration(380).delay(orden * 70).reduceMotion(ReduceMotion.System);

/** Algo que aparece o se va en el lugar (resultados, un mes nuevo del calendario). */
export const aparecer = FadeIn.duration(220).reduceMotion(ReduceMotion.System);
export const desaparecer = FadeOut.duration(160).reduceMotion(ReduceMotion.System);

/** Una barra que crece hasta su valor. */
export const crecer = (valor: number, orden = 0) =>
  withDelay(
    orden * 60,
    withTiming(valor, { duration: 650, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System })
  );
