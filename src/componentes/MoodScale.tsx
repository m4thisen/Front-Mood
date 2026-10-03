import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { moodScale } from '@/tema/colors';
import { colors, typography } from '@/tema';
import { shade } from '@/utils/color';
import { useTranslation } from '@/i18n';
import { MoodLevel } from '@/types/models';

interface Props {
  value: MoodLevel | null;
  onChange: (level: MoodLevel) => void;
}

const FACES: Record<MoodLevel, string> = {
  1: '≖︿≖',
  2: '◡̈',
  3: '◡',
  4: '◠‿◠',
  5: '★‿★',
};

const Dot: React.FC<{
  level: MoodLevel;
  color: string;
  glow: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}> = ({ level, color, glow, label, selected, onPress }) => {
  const scale = useSharedValue(selected ? 1.15 : 1);

  React.useEffect(() => {
    scale.value = withSpring(selected ? 1.18 : 1, { damping: 10, stiffness: 180 });
  }, [selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onPress} hitSlop={6} style={styles.dotWrapper}>
      <Animated.View
        style={[
          styles.dot,
          selected && {
            shadowColor: glow,
            shadowOpacity: 1,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[shade(color, 0.35), color, shade(color, -0.35)]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.dotFill, selected && { borderWidth: 2, borderColor: colors.textPrimary }]}
        >
          <View style={styles.shine} />
          <Text style={styles.face}>{FACES[level]}</Text>
        </LinearGradient>
      </Animated.View>
      <Text
        style={[typography.micro, styles.label, selected && styles.labelSelected]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};
export const MoodScale: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      {moodScale.map((m) => (
        <Dot
          key={m.level}
          level={m.level as MoodLevel}
          color={m.color}
          glow={m.glow}
          label={t(`mood.${m.level}`)}
          selected={value === m.level}
          onPress={() => onChange(m.level as MoodLevel)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dotWrapper: {
    alignItems: 'center',
    paddingHorizontal: 2,
    width: 58,
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  dotFill: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 5,
    left: 8,
    width: 16,
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ rotate: '-20deg' }],
  },
  label: {
    color: colors.textTertiary,
    marginTop: 6,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.textPrimary,
  },
  face: {
    color: 'rgba(5,11,30,0.55)',
    fontSize: 13,
    fontWeight: '700',
  }
});
