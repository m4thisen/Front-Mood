import React from 'react';
import { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';
import type { AndroidSymbol, SFSymbol, SymbolWeight } from 'expo-symbols';
import { colors } from '@/tema';

interface DefinicionIcono {
  /** SF Symbol en reposo. */
  ios: SFSymbol;
  /** SF Symbol para el estado seleccionado (suele ser la versión ".fill"). */
  iosRelleno?: SFSymbol;
  /** Material Symbol equivalente para Android. */
  android: AndroidSymbol;
}

/**
 * Catálogo único de íconos de la app. En iPhone se ven los SF Symbols
 * nativos de Apple; en Android, los Material Symbols equivalentes. Las
 * pantallas nunca usan emojis ni glifos sueltos: siempre un nombre de acá.
 */
const ICONOS = {
  // Navegación
  calendario: { ios: 'calendar', android: 'calendar_month' },
  estadisticas: { ios: 'chart.bar', iosRelleno: 'chart.bar.fill', android: 'bar_chart' },
  comoVenis: { ios: 'sparkles', android: 'auto_awesome' },
  cuenta: { ios: 'person.crop.circle', iosRelleno: 'person.crop.circle.fill', android: 'account_circle' },
  agregar: { ios: 'plus', android: 'add' },
  cerrar: { ios: 'xmark', android: 'close' },
  check: { ios: 'checkmark', android: 'check' },
  atras: { ios: 'chevron.left', android: 'chevron_left' },
  adelante: { ios: 'chevron.right', android: 'chevron_right' },
  desplegar: { ios: 'chevron.down', android: 'expand_more' },
  editar: { ios: 'pencil', android: 'edit' },
  menos: { ios: 'minus', android: 'remove' },

  // Registro del día
  destacado: { ios: 'star', iosRelleno: 'star.fill', android: 'star' },
  sueno: { ios: 'moon.zzz', iosRelleno: 'moon.zzz.fill', android: 'bedtime' },
  ejercicio: { ios: 'figure.run', android: 'directions_run' },
  cancion: { ios: 'music.note', android: 'music_note' },
  texto: { ios: 'text.alignleft', android: 'notes' },
  racha: { ios: 'flame', iosRelleno: 'flame.fill', android: 'local_fire_department' },

  // Clima (RN-06)
  climaSoleado: { ios: 'sun.max', iosRelleno: 'sun.max.fill', android: 'sunny' },
  climaNublado: { ios: 'cloud', iosRelleno: 'cloud.fill', android: 'cloud' },
  climaLluvia: { ios: 'cloud.rain', iosRelleno: 'cloud.rain.fill', android: 'rainy' },
  climaFrio: { ios: 'snowflake', android: 'ac_unit' },
  climaCalor: { ios: 'thermometer.sun', iosRelleno: 'thermometer.sun.fill', android: 'device_thermostat' },

  // Bloques de seguimiento
  bloqueEstudios: { ios: 'book', iosRelleno: 'book.fill', android: 'school' },
  bloqueDescanso: { ios: 'bed.double', iosRelleno: 'bed.double.fill', android: 'hotel' },
  bloqueHobbies: { ios: 'paintpalette', iosRelleno: 'paintpalette.fill', android: 'palette' },
  bloqueEmociones: { ios: 'heart.text.square', iosRelleno: 'heart.text.square.fill', android: 'psychology' },
  bloqueTrabajo: { ios: 'briefcase', iosRelleno: 'briefcase.fill', android: 'work' },
  bloqueAutocuidado: { ios: 'leaf', iosRelleno: 'leaf.fill', android: 'spa' },
  bloqueSalud: { ios: 'cross.case', iosRelleno: 'cross.case.fill', android: 'medical_services' },
  bloqueAmor: { ios: 'heart', iosRelleno: 'heart.fill', android: 'favorite' },
  bloqueTiempo: { ios: 'clock', iosRelleno: 'clock.fill', android: 'schedule' },
  bloqueGente: { ios: 'person.2', iosRelleno: 'person.2.fill', android: 'group' },
  bloqueEjercicio: { ios: 'figure.run', android: 'directions_run' },
  bloqueComidas: { ios: 'fork.knife', android: 'restaurant' },
  bloqueEventos: { ios: 'party.popper', iosRelleno: 'party.popper.fill', android: 'celebration' },
  tag: { ios: 'tag', iosRelleno: 'tag.fill', android: 'sell' },

  // Estadísticas
  franjaManana: { ios: 'sunrise', iosRelleno: 'sunrise.fill', android: 'wb_twilight' },
  franjaTarde: { ios: 'sun.max', iosRelleno: 'sun.max.fill', android: 'light_mode' },
  franjaNoche: { ios: 'sunset', iosRelleno: 'sunset.fill', android: 'wb_twilight' },
  franjaMadrugada: { ios: 'moon.stars', iosRelleno: 'moon.stars.fill', android: 'nights_stay' },
  tendencia: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up' },

  // Cómo venís
  ia: { ios: 'sparkles', android: 'auto_awesome' },
  habito: { ios: 'leaf', iosRelleno: 'leaf.fill', android: 'eco' },
  musica: { ios: 'music.note.list', android: 'queue_music' },

  // Mi cuenta
  idioma: { ios: 'globe', android: 'language' },
  recordatorio: { ios: 'bell', iosRelleno: 'bell.fill', android: 'notifications' },
  bloques: { ios: 'square.grid.2x2', iosRelleno: 'square.grid.2x2.fill', android: 'grid_view' },
  exportar: { ios: 'square.and.arrow.up', android: 'ios_share' },
  documento: { ios: 'doc.text', iosRelleno: 'doc.text.fill', android: 'description' },
  tabla: { ios: 'tablecells', iosRelleno: 'tablecells.fill', android: 'table_chart' },
  cerrarSesion: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
} satisfies Record<string, DefinicionIcono>;

export type NombreIcono = keyof typeof ICONOS;

interface Props {
  nombre: NombreIcono;
  tamano?: number;
  color?: ColorValue;
  /** Usa la versión rellena (por ejemplo, para la pestaña activa). */
  relleno?: boolean;
  peso?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
}

export const Icono: React.FC<Props> = ({
  nombre,
  tamano = 20,
  color = colors.textSecondary,
  relleno = false,
  peso = 'medium',
  style,
}) => {
  const definicion: DefinicionIcono = ICONOS[nombre];
  const ios = relleno && definicion.iosRelleno ? definicion.iosRelleno : definicion.ios;
  return (
    <SymbolView
      name={{ ios, android: definicion.android }}
      size={tamano}
      tintColor={color}
      weight={peso}
      style={[{ width: tamano, height: tamano }, style]}
    />
  );
};
