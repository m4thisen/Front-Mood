import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@/tema';

interface Props {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  /** Distancia al borde inferior: justo encima de la barra. */
  bottom: number;
}

/** Globo de ayuda que apunta hacia abajo (al botón "Hoy" del navbar). */
export const CoachMark: React.FC<Props> = ({ message, visible, onDismiss, bottom }) => {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(600).duration(400)}
      exiting={FadeOut.duration(150)}
      style={[styles.wrapper, { bottom }]}
    >
      <Pressable onPress={onDismiss} accessibilityRole="button" style={styles.pressable}>
        <View style={styles.bubble}>
          <Text style={[typography.bodyMedium, styles.message]}>{message}</Text>
        </View>
        <View style={styles.arrow} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 16,
    alignItems: 'flex-end',
  },
  pressable: {
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
  arrow: {
    width: 14,
    height: 14,
    backgroundColor: colors.accent,
    marginRight: 25,
    marginTop: -6,
    transform: [{ rotate: '45deg' }],
  },
});