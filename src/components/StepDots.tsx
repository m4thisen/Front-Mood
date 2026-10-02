import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';

interface Props {
  total: number;
  current: number; // 0-indexed
}

export const StepDots: React.FC<Props> = ({ total, current }) => (
  <View style={styles.row}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          i === current && styles.dotActive,
          i < current && styles.dotDone,
        ]}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.accent,
  },
  dotDone: {
    backgroundColor: colors.accentSoft,
  },
});
