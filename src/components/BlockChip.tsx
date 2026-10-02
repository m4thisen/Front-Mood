import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '@/theme';

interface Props {
  label: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
}

export const BlockChip: React.FC<Props> = ({ label, icon, selected, onPress }) => {
  if (selected) {
    return (
      <Pressable onPress={onPress} style={styles.chipWrapper}>
        <LinearGradient
          colors={[colors.accent, colors.accentStrong]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chipSelected}
        >
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={[typography.bodyMedium, styles.labelSelected]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.chipWrapper, styles.chip]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[typography.bodyMedium, styles.label]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
  },
  icon: {
    fontSize: 15,
    marginRight: 6,
  },
  label: {
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.background,
  },
});
