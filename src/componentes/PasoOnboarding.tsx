import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BotonIcono } from './Encabezados';
import { colors, radius, spacing, typography } from '@/tema';

export const TOTAL_PASOS = 4;

interface Props {
  /** 0 = primer paso. */
  paso: number;
  titulo: string;
  subtitulo?: string;
  onAtras?: () => void;
  children: React.ReactNode;
  /** Botones fijos abajo. */
  pie: React.ReactNode;
}

/**
 * Esqueleto común de los pasos del onboarding (CU-04): progreso arriba,
 * título grande, contenido y la acción principal siempre a mano abajo.
 */
export const PasoOnboarding: React.FC<Props> = ({ paso, titulo, subtitulo, onAtras, children, pie }) => (
  <SafeAreaView style={styles.pantalla}>
    <View style={styles.barraSuperior}>
      <View style={styles.espacioAtras}>
        {onAtras && <BotonIcono icono="atras" etiqueta="Atrás" onPress={onAtras} tamano={34} />}
      </View>
      <View style={styles.progreso} accessibilityLabel={`Paso ${paso + 1} de ${TOTAL_PASOS}`}>
        {Array.from({ length: TOTAL_PASOS }, (_, i) => (
          <View key={i} style={[styles.segmento, i <= paso && styles.segmentoActivo]} />
        ))}
      </View>
      <View style={styles.espacioAtras} />
    </View>

    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(380)}>
          <Text style={[typography.displayL, styles.titulo]}>{titulo}</Text>
          {subtitulo && <Text style={[typography.body, styles.subtitulo]}>{subtitulo}</Text>}
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(80).duration(380)}>{children}</Animated.View>
      </ScrollView>

      <View style={styles.pie}>{pie}</View>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  espacioAtras: {
    width: 34,
  },
  progreso: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
  },
  segmento: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.fillStrong,
  },
  segmentoActivo: {
    backgroundColor: colors.accent,
  },
  contenido: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  titulo: {
    color: colors.textPrimary,
  },
  subtitulo: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  pie: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
});
