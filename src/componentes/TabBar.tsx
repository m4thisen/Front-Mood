import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icono, NombreIcono } from './Icono';
import { colors, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useRegistroDeHoy } from '@/stores/RegistroStore';
import { hapticos } from '@/utils/hapticos';

const PESTANAS: Record<string, { icono: NombreIcono; etiqueta: string }> = {
  Inicio: { icono: 'calendario', etiqueta: 'tab.calendar' },
  Estadisticas: { icono: 'estadisticas', etiqueta: 'tab.stats' },
  ComoVenis: { icono: 'comoVenis', etiqueta: 'tab.howYouAre' },
  Cuenta: { icono: 'cuenta', etiqueta: 'tab.account' },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Barra inferior al estilo iOS: una cápsula flotante con desenfoque para las
 * secciones y, aparte, el botón circular de "Hoy" — la acción principal de
 * la app. El botón muestra un + mientras el día está pendiente y un ✓ cuando
 * ya se registró.
 */
export const TabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const registroDeHoy = useRegistroDeHoy();
  const escalaHoy = useSharedValue(1);
  const estiloHoy = useAnimatedStyle(() => ({ transform: [{ scale: escalaHoy.value }] }));

  const ir = (nombre: string, enfocada: boolean) => {
    if (enfocada) return;
    hapticos.seleccion();
    navigation.navigate(nombre);
  };

  const rutaHoy = state.routes.find((r) => r.name === 'Registro');
  const hoyEnfocada = state.routes[state.index]?.name === 'Registro';

  return (
    <View style={[styles.envoltorio, { paddingBottom: Math.max(insets.bottom - 6, spacing.md) }]} pointerEvents="box-none">
      {/* Desvanece el contenido que pasa por debajo de la barra. */}
      <LinearGradient
        colors={['rgba(5,11,30,0)', 'rgba(5,11,30,0.96)', '#050B1E']}
        locations={[0, 0.2, 1]}
        style={styles.desvanecido}
        pointerEvents="none"
      />
      <View style={styles.capsula}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.velo} />
        {state.routes
          .filter((r) => r.name !== 'Registro')
          .map((ruta) => {
            const enfocada = state.routes[state.index]?.key === ruta.key;
            const pestana = PESTANAS[ruta.name];
            const color = enfocada ? colors.textPrimary : colors.textTertiary;
            return (
              <Pressable
                key={ruta.key}
                onPress={() => ir(ruta.name, enfocada)}
                accessibilityRole="tab"
                accessibilityState={{ selected: enfocada }}
                accessibilityLabel={t(pestana.etiqueta)}
                style={styles.pestana}
              >
                <View style={[styles.fondoActivo, enfocada && styles.fondoActivoVisible]} />
                <Icono nombre={pestana.icono} tamano={21} color={color} relleno={enfocada} />
                <Text style={[typography.micro, styles.etiqueta, { color }]} numberOfLines={1}>
                  {t(pestana.etiqueta)}
                </Text>
              </Pressable>
            );
          })}
      </View>

      {rutaHoy && (
        <AnimatedPressable
          onPress={() => {
            hapticos.toque();
            if (!hoyEnfocada) navigation.navigate(rutaHoy.name);
          }}
          onPressIn={() => (escalaHoy.value = withSpring(0.92, { damping: 18, stiffness: 400 }))}
          onPressOut={() => (escalaHoy.value = withSpring(1, { damping: 12, stiffness: 260 }))}
          accessibilityRole="tab"
          accessibilityState={{ selected: hoyEnfocada }}
          accessibilityLabel={t('tab.today')}
          style={[styles.botonHoy, registroDeHoy && styles.botonHoyListo, estiloHoy]}
        >
          <Icono
            nombre={registroDeHoy ? 'check' : 'agregar'}
            tamano={24}
            color={registroDeHoy ? colors.accentStrong : colors.background}
            peso="bold"
          />
        </AnimatedPressable>
      )}
    </View>
  );
};

const ALTO = 64;

const styles = StyleSheet.create({
  envoltorio: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  desvanecido: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: -24,
  },
  capsula: {
    flex: 1,
    height: ALTO,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ALTO / 2,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    paddingHorizontal: 6,
  },
  velo: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(22, 26, 40, 0.62)',
  },
  pestana: {
    flex: 1,
    height: ALTO - 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  fondoActivo: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: (ALTO - 12) / 2,
  },
  fondoActivoVisible: {
    backgroundColor: colors.fillStrong,
  },
  etiqueta: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
  botonHoy: {
    width: ALTO,
    height: ALTO,
    borderRadius: ALTO / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  botonHoyListo: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    shadowOpacity: 0,
  },
});

/** Alto total que ocupa la barra flotante, para ubicar contenido justo encima. */
export function useAltoBarraInferior(): number {
  const insets = useSafeAreaInsets();
  return ALTO + Math.max(insets.bottom - 6, spacing.md);
}
