import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SoulOrb } from '@/componentes/SoulOrb';
import { Boton } from '@/componentes/Boton';
import { colors, spacing, typography } from '@/tema';
import { moodScale } from '@/tema/colors';
import { useTranslation } from '@/i18n';
import { useSesionStore } from '@/stores/SesionStore';
import { hapticos } from '@/utils/hapticos';

/**
 * Cierre del onboarding: presenta el Color del Alma. Al completar el
 * onboarding, el navegador pasa solo a la app principal.
 */
export const ColorDelAlmaScreen: React.FC = () => {
  const { t } = useTranslation();
  const nombre = useSesionStore((s) => s.usuario?.nombre ?? '');
  const completarOnboarding = useSesionStore((s) => s.completarOnboarding);

  const empezar = () => {
    hapticos.exito();
    completarOnboarding();
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      <View style={styles.centro}>
        <Animated.View entering={FadeIn.duration(1100)}>
          <SoulOrb color={moodScale[3].color} size={168} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(500).duration(600)} style={[typography.displayL, styles.titulo]}>
          {t('soulReveal.title').replace('{nombre}', nombre)}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(700).duration(600)} style={[typography.body, styles.texto]}>
          {t('soulReveal.description')}
        </Animated.Text>
      </View>
      <Animated.View entering={FadeInDown.delay(900).duration(600)} style={styles.pie}>
        <Boton titulo={t('soulReveal.cta')} onPress={empezar} />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  titulo: {
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  texto: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  pie: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
});
