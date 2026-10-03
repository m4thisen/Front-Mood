import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { GlowButton } from '@/componentes/GlowButton';
import { StepDots } from '@/componentes/StepDots';
import { EditorTags } from '@/componentes/EditorTags';
import { colors, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { RootStackParamList } from '@/navegacion/tipos';

type Props = NativeStackScreenProps<RootStackParamList, 'Tags'>;

/** Paso opcional del onboarding: tags propios del usuario (CU-04, pasos 5 y 6). */
export const TagsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <StepDots total={4} current={2} />
      <Text style={[typography.displayM, styles.title]}>{t('steps.tagsTitle')}</Text>
      <Text style={[typography.body, styles.subtitle]}>{t('steps.tagsSubtitle')}</Text>
      <EditorTags />
      <GlowButton
        label={t('common.continue')}
        onPress={() => navigation.navigate('Recordatorio')}
        style={styles.continueButton}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  continueButton: {
    marginTop: spacing.xl,
  },
});
