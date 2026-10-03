import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icono, NombreIcono } from './Icono';
import { colors, radius, spacing, typography } from '@/tema';
import { hapticos } from '@/utils/hapticos';

type Variante = 'primario' | 'secundario' | 'texto' | 'peligro';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  icono?: NombreIcono;
  deshabilitado?: boolean;
  cargando?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLOR_TEXTO: Record<Variante, string> = {
  primario: colors.background,
  secundario: colors.textPrimary,
  texto: colors.textSecondary,
  peligro: colors.danger,
};

/**
 * Botón de la app. El primario es sólido (sin degradé) para que el único
 * color que "brille" en pantalla sea el de los ánimos.
 */
export const Boton: React.FC<Props> = ({
  titulo,
  onPress,
  variante = 'primario',
  icono,
  deshabilitado = false,
  cargando = false,
  style,
}) => {
  const escala = useSharedValue(1);
  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
  const inactivo = deshabilitado || cargando;
  const colorTexto = inactivo && variante === 'primario' ? colors.textTertiary : COLOR_TEXTO[variante];

  const presionar = () => {
    if (variante === 'primario') hapticos.toque();
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={presionar}
      onPressIn={() => (escala.value = withSpring(0.97, { damping: 20, stiffness: 400 }))}
      onPressOut={() => (escala.value = withSpring(1, { damping: 15, stiffness: 300 }))}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      style={[
        styles.base,
        variante === 'primario' && (inactivo ? styles.primarioInactivo : styles.primario),
        variante === 'secundario' && styles.secundario,
        (variante === 'texto' || variante === 'peligro') && styles.texto,
        variante !== 'primario' && inactivo && styles.atenuado,
        estiloAnimado,
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <View style={styles.contenido}>
          {icono && <Icono nombre={icono} tamano={18} color={colorTexto} peso="semibold" />}
          <Text style={[typography.headline, { color: colorTexto }]}>{titulo}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  primario: {
    backgroundColor: colors.accent,
  },
  primarioInactivo: {
    backgroundColor: colors.surfaceElevatedAlt,
  },
  secundario: {
    backgroundColor: colors.fill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  texto: {
    minHeight: 44,
  },
  atenuado: {
    opacity: 0.4,
  },
});
