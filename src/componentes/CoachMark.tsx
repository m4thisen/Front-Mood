import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/tema';

interface Props {
  message: string;
  step: string; // ej. "1/2"
  visible: boolean;
  onDismiss: () => void;
  /** Distancia al borde inferior: justo encima de la barra. */
  bottom: number;
}

/** Globo de ayuda que apunta hacia abajo (al botón "Hoy" del navbar). */
export const CoachMark: React.FC<Props> = ({ message, step, visible, onDismiss, bottom }) => {
  if (!visible) return null;

  return (
    <Pressable onPress={onDismiss} style={[styles.wrapper, { bottom }]} accessibilityRole="button">
      <View style={styles.bubble}>
        <Text style={[typography.bodyMedium, styles.message]}>{message}</Text>
        <Text style={[typography.caption, styles.step]}>{step}</Text>
      </View>
      <View style={styles.arrow} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 16,
    alignItems: 'flex-end',
  },
  bubble: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    maxWidth: 220,
  },
  message: {
    color: colors.background,
  },
  step: {
    color: 'rgba(5,11,30,0.6)',
    marginTop: 2,
  },
  arrow: {
    width: 14,
    height: 14,
    backgroundColor: colors.accent,
    marginRight: 25,
    marginTop: -6,
    transform: [{ rotate: '45deg' }],
  },
});