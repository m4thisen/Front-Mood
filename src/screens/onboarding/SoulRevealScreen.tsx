import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ScreenContainer } from '@/components/ScreenContainer';
import { GlowButton } from '@/components/GlowButton';
import { SoulOrb } from '@/components/SoulOrb';
import { colors, spacing, typography } from '@/theme';
import { useTranslation } from '@/i18n';
import { moodScale } from '@/theme/colors';

export const SoulRevealScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();

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
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
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