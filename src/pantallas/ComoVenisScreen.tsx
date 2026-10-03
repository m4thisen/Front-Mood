import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { EncabezadoPantalla, EncabezadoSeccion } from '@/componentes/Encabezados';
import { AiSummaryCard } from '@/componentes/AiSummaryCard';
import { HabitRecommendationCard } from '@/componentes/HabitRecommendationCard';
import { PlaylistRecommendationCard } from '@/componentes/PlaylistRecommendationCard';
import { Icono } from '@/componentes/Icono';
import { useAltoBarraInferior } from '@/componentes/TabBar';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';

/**
 * "Cómo venís" (CU-21): todo lo que genera la IA en su propia sección — la
 * devolución, los hábitos para reforzar y la música sugerida. En la
 * iteración 5 se suma la devolución semanal de los domingos y los datos
 * pasan a venir del servidor.
 */
export const ComoVenisScreen: React.FC = () => {
  const { t } = useTranslation();
  const altoBarra = useAltoBarraInferior();

  return (
    <ScreenContainer scroll contentStyle={[styles.content, { paddingBottom: altoBarra + spacing.xl }]}>
      <EncabezadoPantalla titulo={t('howYouAre.title')} antetitulo={t('howYouAre.subtitle')} />

      <AiSummaryCard />

      <EncabezadoSeccion titulo={t('ai.habitsTitle')} />
      <HabitRecommendationCard />

      <EncabezadoSeccion titulo={t('ai.playlistsTitle')} />
      <PlaylistRecommendationCard />

      <View style={styles.semanal}>
        <Icono nombre="calendario" tamano={16} color={colors.textTertiary} />
        <Text style={[typography.footnote, styles.textoSemanal]}>{t('howYouAre.weeklyNotice')}</Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
  },
  semanal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.fill,
  },
  textoSemanal: {
    flex: 1,
    color: colors.textSecondary,
  },
});
