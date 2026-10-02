import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export const Card: React.FC<Props> = ({ children, style, elevated }) => (
  <View style={[styles.card, elevated && styles.elevated, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
  },
});
