import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { AiSummaryCard } from '@/componentes/AiSummaryCard';
import { HabitRecommendationCard } from '@/componentes/HabitRecommendationCard';
import { PlaylistRecommendationCard } from '@/componentes/PlaylistRecommendationCard';
import { colors, spacing, typography, TAB_BAR_CLEARANCE } from '@/tema';
import { useTranslation } from '@/i18n';

/**
 * "Cómo venís" (CU-21): reúne todo lo que genera la IA — la devolución, los
 * hábitos sugeridos y las canciones recomendadas — en su propia sección,
 * para que el calendario quede limpio. En la iteración 5 se suman la
 * devolución semanal de los domingos y los datos reales del servidor.
 */
export const ComoVenisScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <Text style={[typography.displayM, styles.header]}>{t('howYouAre.title')}</Text>
      <AiSummaryCard />
      <HabitRecommendationCard />
      <PlaylistRecommendationCard />
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
});
