import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moodScale } from '@/tema/colors';
import { colors, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';

interface Props {
  distribution: number[]; // 5 valores, uno por nivel de mood
}

/** Barra segmentada + % por nivel — inspirada en el "status bar" de apps
 * similares, complementa el gráfico de barras verticales. */
export const MoodStatusBar: React.FC<Props> = ({ distribution }) => {
  const { t } = useTranslation();
  const total = distribution.reduce((a, b) => a + b, 0);

  return (
    <View>
      <View style={styles.iconsRow}>
        {moodScale.map((m, i) => {
          const pct = total > 0 ? Math.round((distribution[i] / total) * 100) : 0;
          return (
            <View key={m.level} style={styles.iconColumn}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: pct > 0 ? m.color : colors.surfaceElevatedAlt },
                ]}
              />
              <Text style={[typography.micro, styles.pct, pct > 0 && { color: m.color }]}>
                {pct}%
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.track}>
        {moodScale.map((m, i) => {
          const pct = total > 0 ? (distribution[i] / total) * 100 : 0;
          if (pct === 0) return null;
          return <View key={m.level} style={[styles.segment, { flex: pct, backgroundColor: m.color }]} />;
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconColumn: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 4,
  },
  pct: {
    color: colors.textTertiary,
  },
  track: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevatedAlt,
  },
  segment: {
    height: '100%',
  },
});