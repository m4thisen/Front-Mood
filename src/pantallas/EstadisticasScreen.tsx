import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { Card } from '@/componentes/Card';
import { MoodDistributionChart } from '@/componentes/MoodDistributionChart';
import { colors, spacing, typography, TAB_BAR_CLEARANCE } from '@/tema';
import { useTranslation } from '@/i18n';
import { useIndicadoresProgreso, useListaRegistros } from '@/stores/RegistroStore';
import { claveTraduccionEtiqueta } from '@/datos/catalogoBloques';
import { MoodStatusBar } from '@/componentes/MoodStatusBar';
import { weekdayName } from '@/utils/fecha';
import {
  animoConEtiqueta,
  distribucion,
  FranjaHoraria,
  franjaHoraria,
  frecuencias,
  mejorDiaSemana,
  promedio,
} from '@/servicios/MotorEstadistico';

const ICONOS_FRANJA: Record<FranjaHoraria, string> = {
  MANANA: '☀️',
  TARDE: '🌤️',
  NOCHE: '🌆',
  MADRUGADA: '🌙',
};

export const EstadisticasScreen: React.FC = () => {
  const { t, language } = useTranslation();
  const registros = useListaRegistros();
  const { rachaMaxima, diasRegistrados } = useIndicadoresProgreso();

  const hasData = registros.length > 0;
  const avgMood = useMemo(() => promedio(registros), [registros]);
  const bucket = useMemo(() => franjaHoraria(registros), [registros]);
  const topTags = useMemo(() => frecuencias(registros, 6), [registros]);
  const distribution = useMemo(() => distribucion(registros), [registros]);
  const bestWeekday = useMemo(() => mejorDiaSemana(registros), [registros]);

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <Text style={[typography.displayM, styles.header]}>{t('stats.title')}</Text>

      {!hasData ? (
        <Card>
          <Text style={[typography.body, styles.emptyText]}>{t('stats.noData')}</Text>
        </Card>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <Card style={styles.summaryCard}>
              <Text style={[typography.statNumber, styles.statNumber]}>{avgMood?.toFixed(1)}</Text>
              <Text style={[typography.caption, styles.statLabel]}>{t('stats.avgMood')}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={[typography.statNumber, styles.statNumber]}>{diasRegistrados}</Text>
              <Text style={[typography.caption, styles.statLabel]}>{t('stats.totalEntries')}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={[typography.statNumber, styles.statNumber]}>🔥{rachaMaxima}</Text>
              <Text style={[typography.caption, styles.statLabel]}>{t('stats.longestStreak')}</Text>
            </Card>
          </View>

          <Card style={styles.card}>
            <Text style={[typography.subtitle, styles.cardTitle]}>{t('stats.distributionTitle')}</Text>
            <Text style={[typography.caption, styles.cardDesc]}>{t('stats.distributionDesc')}</Text>
            <View style={{ marginTop: spacing.md }}>
              <MoodDistributionChart distribution={distribution} />
               <View style={{ marginTop: spacing.lg }}>
                <MoodStatusBar distribution={distribution} />
              </View>
            </View>
          </Card>

          {bestWeekday && (
            <Card style={styles.card}>
              <Text style={[typography.subtitle, styles.cardTitle]}>{t('stats.bestWeekdayTitle')}</Text>
              <Text style={[typography.caption, styles.cardDesc]}>{t('stats.bestWeekdayDesc')}</Text>
              <View style={styles.weekdayRow}>
                <Text style={[typography.displayM, styles.weekdayName]}>
                  {weekdayName(bestWeekday.diaSemana, language)}
                </Text>
                <Text style={[typography.title, styles.weekdayAvg]}>{bestWeekday.promedio.toFixed(1)} ★</Text>
              </View>
            </Card>
          )}

          {bucket && (
            <Card style={styles.card}>
              <Text style={[typography.subtitle, styles.cardTitle]}>{t('stats.loggingTime')}</Text>
              <Text style={[typography.caption, styles.cardDesc]}>{t('stats.loggingTimeDesc')}</Text>
              <Text style={styles.bucketEmoji}>{ICONOS_FRANJA[bucket]}</Text>
            </Card>
          )}

          {topTags.length > 0 && (
            <Card style={styles.card}>
              <Text style={[typography.subtitle, styles.cardTitle]}>{t('stats.topTags')}</Text>
              {topTags.map((tag) => (
                <View key={tag.clave} style={styles.tagRow}>
                  <Text style={[typography.body, styles.tagLabel]}>{t(claveTraduccionEtiqueta(tag.clave))}</Text>
                  <View style={styles.tagBarTrack}>
                    <View
                      style={[
                        styles.tagBarFill,
                        { width: `${Math.min(100, (tag.cantidad / topTags[0].cantidad) * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={[typography.caption, styles.tagCount]}>{tag.cantidad}</Text>
                </View>
              ))}
            </Card>
          )}

          {topTags.length > 0 && (
            <Card style={styles.card}>
              <Text style={[typography.subtitle, styles.cardTitle]}>{t('stats.moodByHabit')}</Text>
              <Text style={[typography.caption, styles.cardDesc]}>{t('stats.moodByHabitDesc')}</Text>
              {topTags.slice(0, 4).map((tag) => {
                const comparison = animoConEtiqueta(registros, tag.clave);
                if (!comparison) return null;
                const diff = (
                  ((comparison.conEtiqueta - comparison.general) / comparison.general) *
                  100
                ).toFixed(0);
                const positive = comparison.conEtiqueta >= comparison.general;
                return (
                  <View key={tag.clave} style={styles.habitRow}>
                    <Text style={[typography.body, styles.tagLabel]}>{t(claveTraduccionEtiqueta(tag.clave))}</Text>
                    <Text style={[typography.bodyMedium, positive ? styles.diffPositive : styles.diffNegative]}>
                      {positive ? '+' : ''}
                      {diff}%
                    </Text>
                  </View>
                );
              })}
            </Card>
          )}
        </>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  header: {
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  summaryCardMid: {
    marginHorizontal: spacing.sm,
  },
  statNumber: {
    color: colors.accent,
  },
  statLabel: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
  },
  cardDesc: {
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  bucketEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  weekdayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  weekdayName: {
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  weekdayAvg: {
    color: colors.gold,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  tagLabel: {
    color: colors.textSecondary,
    width: '38%',
  },
  tagBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevatedAlt,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  tagBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  tagCount: {
    color: colors.textTertiary,
    width: 20,
    textAlign: 'right',
  },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  diffPositive: {
    color: colors.success,
  },
  diffNegative: {
    color: colors.danger,
  },
});
