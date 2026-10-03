import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useIndicadoresProgreso, useListaRegistros } from '@/stores/RegistroStore';
import { generateAiSummary } from '@/api/simulado/devolucionesSimuladas';

/**
 * Resumen de "cómo venís" hecho por IA. Hoy es 100% mock (ver
 * api/simulado/devolucionesSimuladas.ts) — el día que haya un backend con un modelo real,
 * solo hay que reemplazar generateAiSummary por la llamada a la API.
 */
export const AiSummaryCard: React.FC = () => {
  const { t } = useTranslation();
  const registros = useListaRegistros();
  const { rachaActual } = useIndicadoresProgreso();

  const summary = useMemo(() => generateAiSummary(registros, rachaActual, t), [registros, rachaActual, t]);

  return (
    <Card style={styles.card} elevated>
      <View style={styles.headerRow}>
        <Text style={[typography.subtitle, styles.title]}>✨ {t('ai.summaryTitle')}</Text>
        <View style={styles.badge}>
          <Text style={[typography.micro, styles.badgeText]}>{t('ai.badge')}</Text>
        </View>
      </View>
      <Text style={[typography.body, styles.body]}>{summary ?? t('ai.noData')}</Text>
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
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.accentStrong,
  },
  body: {
    color: colors.textSecondary,
  },
});
