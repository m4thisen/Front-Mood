import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { GlowButton } from '@/componentes/GlowButton';
import { SoulOrb } from '@/componentes/SoulOrb';
import { colors, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { moodScale } from '@/tema/colors';
import { useSesionStore } from '@/stores/SesionStore';

export const ColorDelAlmaScreen: React.FC = () => {
  const { t } = useTranslation();
  // Al completar el onboarding el navegador pasa solo a la app principal.
  const completarOnboarding = useSesionStore((s) => s.completarOnboarding);

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(900)}>
          <SoulOrb color={moodScale[3].color} size={140} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={[typography.displayL, styles.title]}>
          {t('soulReveal.title')}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(550).duration(600)} style={[typography.body, styles.desc]}>
          {t('soulReveal.description')}
        </Animated.Text>
      </View>
      <Animated.View entering={FadeInDown.delay(700).duration(600)}>
        <GlowButton
          label={t('soulReveal.cta')}
          onPress={completarOnboarding}
        />
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
    paddingVertical: spacing.xxxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  desc: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});