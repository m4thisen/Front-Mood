import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/ScreenContainer';
import { GlowButton } from '@/components/GlowButton';
import { StepDots } from '@/components/StepDots';
import { colors, radius, spacing, typography } from '@/theme';
import { useTranslation } from '@/i18n';
import { useApp } from '@/context/AppContext';
import { RootStackParamList } from '@/navigation/types';
import { SPECIAL_BLOCKS } from '@/data/blocks';
import { SpecialBlockKey } from '@/types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'SpecialBlocks'>;

export const SpecialBlocksScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { profile, updateProfile } = useApp();

  const [selected, setSelected] = useState<Set<SpecialBlockKey>>(
    new Set(profile?.selectedSpecialBlocks ?? [])
  );

  const toggle = (key: SpecialBlockKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleContinue = () => {
    updateProfile({ selectedSpecialBlocks: Array.from(selected) });
    navigation.navigate('NotificationTime');
  };

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <StepDots total={3} current={2} />
      <Text style={[typography.displayM, styles.title]}>{t('steps.specialTitle')}</Text>
      <Text style={[typography.body, styles.subtitle]}>{t('steps.specialSubtitle')}</Text>

      <View style={styles.grid}>
        {SPECIAL_BLOCKS.map((block) => {
          const isSelected = selected.has(block.key);
          return (
            <Pressable
              key={block.key}
              onPress={() => toggle(block.key)}
              style={[styles.card, isSelected && styles.cardSelected]}
            >
              <Text style={styles.icon}>{block.icon}</Text>
              <Text style={[typography.subtitle, styles.cardTitle]}>{t(block.titleKey)}</Text>
              <Text style={[typography.caption, styles.cardDesc]}>{t(block.descriptionKey)}</Text>
            </Pressable>
          );
        })}
      </View>

      <GlowButton label={t('common.continue')} onPress={handleContinue} style={styles.continueButton} />
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
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  icon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    color: colors.textPrimary,
  },
  cardDesc: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  continueButton: {
    marginTop: spacing.lg,
  },
});
