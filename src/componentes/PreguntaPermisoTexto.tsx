import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Boton } from './Boton';
import { Icono } from './Icono';
import { colors, radius, spacing, typography } from '@/tema';

/** Lo que se le explica a la persona antes de que dé el permiso: qué se manda, para qué y cómo se retira. */
export const EXPLICACION_PERMISO_TEXTO =
  'Claude lee el texto de cada día para entender mejor qué te pasó y darte devoluciones más precisas. ' +
  'Antes de mandarlo le sacamos nombres, mails y teléfonos. Lo que entiende (por ejemplo, "saliste con ' +
  'amigos") también ayuda a mejorar el modelo, pero tu texto nunca se guarda ahí. Si lo apagás, borramos ' +
  'todo lo que ya leyó.';

/**
 * Debajo del texto del día, la primera vez que la persona escribe: le pregunta
 * si la IA puede leerlo. No interrumpe (no es una ventana) y aparece una sola
 * vez; después se cambia en Mi cuenta. El permiso nunca se da solo.
 */
export const PreguntaPermisoTexto: React.FC<{ onResponder: (permitido: boolean) => void }> = ({ onResponder }) => (
  <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOut.duration(200)} style={styles.tarjeta}>
    <View style={styles.cabecera}>
      <Icono nombre="ia" tamano={16} color={colors.accentStrong} peso="semibold" />
      <Text style={[typography.bodyMedium, styles.titulo]}>¿Querés que la IA lea lo que escribís?</Text>
    </View>
    <Text style={[typography.footnote, styles.explicacion]}>{EXPLICACION_PERMISO_TEXTO}</Text>
    <Text style={[typography.footnote, styles.nota]}>Lo podés cambiar cuando quieras en Mi cuenta.</Text>
    <View style={styles.botones}>
      <Boton titulo="Ahora no" variante="secundario" onPress={() => onResponder(false)} style={styles.boton} />
      <Boton titulo="Activar" onPress={() => onResponder(true)} style={styles.boton} />
    </View>
  </Animated.View>
);

const styles = StyleSheet.create({
  tarjeta: {
    marginTop: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titulo: {
    flex: 1,
    color: colors.textPrimary,
  },
  explicacion: {
    color: colors.textSecondary,
  },
  nota: {
    color: colors.textTertiary,
  },
  botones: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  boton: {
    flex: 1,
  },
});
