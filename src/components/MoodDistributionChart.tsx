import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moodScale } from '@/theme/colors';
import { colors, spacing, typography } from '@/theme';
import { useTranslation } from '@/i18n';

interface Props {
  distribution: number[]; // 5 valores, uno por nivel de mood
}

const CHART_HEIGHT = 90;

export const MoodDistributionChart: React.FC<Props> = ({ distribution }) => {
  const { t } = useTranslation();
  const max = Math.max(1, ...distribution);

  return (
    <View>
      <View style={styles.chart}>
        {moodScale.map((m, i) => {
          const count = distribution[i];
          const barHeight = Math.max(4, (count / max) * CHART_HEIGHT);
          return (
            <View key={m.level} style={styles.column}>
              <Text style={[typography.caption, styles.count]}>{count > 0 ? count : ''}</Text>
              <View
                style={[
                  styles.bar,
                  { height: barHeight, backgroundColor: m.color, shadowColor: m.glow },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labelsRow}>
        {moodScale.map((m) => (
          <Text key={m.level} style={[typography.micro, styles.label]} numberOfLines={1}>
            {t(`mood.${m.level}`)}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT + 22,
    paddingHorizontal: 4,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  count: {
    color: colors.textTertiary,
    marginBottom: 4,
  },
  bar: {
    width: 22,
    borderRadius: 8,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: 4,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    color: colors.textTertiary,
  },
});
