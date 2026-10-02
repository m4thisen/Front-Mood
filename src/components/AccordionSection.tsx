import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, spacing, typography } from '@/theme';

interface Props {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** Sección colapsable para el formulario diario — evita que la pantalla
 * se vuelva gigante cuando el usuario eligió muchos bloques. */
export const AccordionSection: React.FC<Props> = ({ title, icon, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const rotation = useSharedValue(defaultOpen ? 1 : 0);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    rotation.value = withTiming(next ? 1 : 0, { duration: 180 });
  };

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={toggle} style={styles.header}>
        <Text style={[typography.caption, styles.title]}>
          {icon ? `${icon} ` : ''}
          {title}
        </Text>
        <Animated.Text style={[styles.arrow, arrowStyle]}>▾</Animated.Text>
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.textTertiary,
  },
  arrow: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  body: {
    marginTop: spacing.sm,
  },
});