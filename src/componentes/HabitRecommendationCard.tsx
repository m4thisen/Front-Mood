import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useApp } from '@/context/AppContext';
import { generateRecommendedHabits } from '@/api/simulado/devolucionesSimuladas';

/**
 * Hábitos recomendados: si hay suficientes datos, ordena por correlación
 * real con mejor ánimo (usando computeMoodByOption); si no, muestra
 * sugerencias genéricas. La parte de "generado por IA" es mock — la lógica
 * de correlación en sí ya es real, corre sobre los datos del usuario.
 */
export const HabitRecommendationCard: React.FC = () => {
  const { t } = useTranslation();
  const { entries } = useApp();

  const habits = useMemo(() => generateRecommendedHabits(entries, t), [entries, t]);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={[typography.subtitle, styles.title]}>🌱 {t('ai.habitsTitle')}</Text>
        <View style={styles.badge}>
          <Text style={[typography.micro, styles.badgeText]}>{t('ai.habitsBadge')}</Text>
        </View>
      </View>
      {habits.map((habit, i) => (
        <View key={i} style={[styles.row, i === habits.length - 1 && styles.rowLast]}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>{habit.icon}</Text>
          </View>
          <View style={styles.rowText}>
            <Text style={[typography.bodyMedium, styles.rowTitle]}>{habit.label}</Text>
            <Text style={[typography.caption, styles.rowReason]}>{habit.reason}</Text>
          </View>
          {habit.percent !== null && (
            <View style={styles.percentBadge}>
              <Text style={[typography.bodyMedium, styles.percentText]}>+{habit.percent}%</Text>
            </View>
          )}
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.surfaceElevatedAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.textTertiary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevatedAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: colors.textPrimary,
  },
  rowReason: {
    color: colors.textTertiary,
    marginTop: 1,
  },
  percentBadge: {
    backgroundColor: colors.goldSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginLeft: spacing.sm,
  },
  percentText: {
    color: colors.gold,
  },
});
