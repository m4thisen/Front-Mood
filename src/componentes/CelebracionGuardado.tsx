import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { CaraAnimo } from './CaraAnimo';
import { Icono } from './Icono';
import { NivelAnimo } from '@/dominio';
import { colors, spacing, typography } from '@/tema';
import { getMoodColor } from '@/tema/colors';
import { hapticos } from '@/utils/hapticos';

interface Props {
  nivel: NivelAnimo;
  titulo: string;
  racha: number;
  textoRacha: string;
  onTerminar: () => void;
}

const DURACION_MS = 1600;

/**
 * Pequeño festejo al guardar el día: la carita elegida aparece con un
 * resorte, se muestra la racha y la pantalla vuelve sola al calendario.
 */
export const CelebracionGuardado: React.FC<Props> = ({ nivel, titulo, racha, textoRacha, onTerminar }) => {
  useEffect(() => {
    hapticos.exito();
    const temporizador = setTimeout(onTerminar, DURACION_MS);
    return () => clearTimeout(temporizador);
  }, [onTerminar]);

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(220)} style={styles.fondo}>
      <Animated.View entering={ZoomIn.springify().damping(12).stiffness(160)} style={styles.centro}>
        <View style={[styles.halo, { backgroundColor: getMoodColor(nivel), shadowColor: getMoodColor(nivel) }]} />
        <CaraAnimo nivel={nivel} tamano={112} />
      </Animated.View>
      <Animated.Text entering={FadeIn.delay(160).duration(300)} style={[typography.displayM, styles.titulo]}>
        {titulo}
      </Animated.Text>
      {racha > 0 && (
        <Animated.View entering={FadeIn.delay(280).duration(300)} style={styles.racha}>
          <Icono nombre="racha" relleno tamano={16} color={colors.gold} />
          <Text style={[typography.bodyMedium, styles.textoRacha]}>{textoRacha}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fondo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.22,
    shadowOpacity: 0.9,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  titulo: {
    color: colors.textPrimary,
    marginTop: spacing.xl,
  },
  racha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  textoRacha: {
    color: colors.textSecondary,
  },
});
