import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '@/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GlowButton: React.FC<Props> = ({ label, onPress, variant = 'primary', disabled, style }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 90 });
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 140 });
  };

  const content = (
    <Text
      style={[
        typography.subtitle,
        variant === 'primary' && styles.labelOnGradient,
        variant === 'secondary' && styles.labelOnSurface,
        variant === 'ghost' && styles.labelGhost,
        disabled && styles.labelDisabled,
      ]}
    >
      {label}
    </Text>
  );

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[animatedStyle, style]}
      >
        <LinearGradient
          colors={disabled ? ['#3A4260', '#2C3350'] : [colors.accent, colors.accentStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primary}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        animatedStyle,
        variant === 'secondary' ? styles.secondary : styles.ghost,
        style,
      ]}
    >
      {content}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  primary: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghost: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelOnGradient: {
    color: colors.background,
  },
  labelOnSurface: {
    color: colors.textPrimary,
  },
  labelGhost: {
    color: colors.textSecondary,
  },
  labelDisabled: {
    color: colors.textTertiary,
  },
});
