import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { GlowButton } from '@/componentes/GlowButton';
import { SoulOrb } from '@/componentes/SoulOrb';
import { colors, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useApp } from '@/context/AppContext';
import { RootStackParamList } from '@/navegacion/tipos';
import { moodScale } from '@/tema/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Bienvenida'>;

export const BienvenidaScreen: React.FC<Props> = ({ navigation }) => {
  const { t, language, setLanguage } = useTranslation();
  const { beginOnboarding } = useApp();

  // Crear cuenta e iniciar sesión usan un único endpoint (POST /auth/google):
  // el servidor decide si crea o si entra. El flujo con Google se conecta en
  // la iteración 1; mientras tanto ambos botones abren el onboarding.
  const ingresar = () => {
    beginOnboarding();
    navigation.navigate('DatosBasicos');
  };

  // Color de muestra para el orbe de bienvenida: un promedio de toda la escala.
  const previewColor = moodScale[3].color;

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.languageRow}>
        <View style={styles.langSwitch}>
          {(['es', 'en'] as const).map((lang) => (
            <Pressable
              key={lang}
              onPress={() => setLanguage(lang)}
              style={[styles.langButton, language === lang && styles.langButtonActive]}
            >
              <Text
                style={[
                  typography.bodyMedium,
                  styles.langText,
                  language === lang && styles.langTextActive,
                ]}
              >
                {lang === 'es' ? '🇦🇷 ES' : '🇺🇸 EN'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.hero}>
        <Animated.View entering={FadeIn.duration(700)}>
          <SoulOrb color={previewColor} size={120} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(150).duration(600)} style={[typography.displayXL, styles.title]}>
          {t('appName')}
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(250).duration(600)}
          style={[typography.body, styles.description]}
        >
          {t('welcome.description')}
        </Animated.Text>
      </View>

      <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.actions}>
        <GlowButton label={t('welcome.register')} onPress={ingresar} />
        <GlowButton
          label={t('welcome.login')}
          onPress={ingresar}
          variant="ghost"
          style={styles.spaced}
        />
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  langSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 4,
  },
  langButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
  },
  langButtonActive: {
    backgroundColor: colors.accent,
  },
  langText: {
    color: colors.textSecondary,
  },
  langTextActive: {
    color: colors.background,
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    marginTop: spacing.xl,
  },
  description: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actions: {
    width: '100%',
  },
  spaced: {
    marginTop: spacing.md,
  },
});
