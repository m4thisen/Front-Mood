import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { GlowButton } from '@/componentes/GlowButton';
import { StepDots } from '@/componentes/StepDots';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useApp } from '@/context/AppContext';
import { RootStackParamList } from '@/navegacion/tipos';
import { BLOCK_CATEGORIES } from '@/datos/catalogoBloques';
import { BlockCategoryKey } from '@/types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'Bloques'>;

export const BloquesScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { profile, updateProfile } = useApp();

  const [selected, setSelected] = useState<Set<BlockCategoryKey>>(
    new Set(profile?.selectedBlocks ?? [])
  );

  const toggle = (key: BlockCategoryKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleContinue = () => {
    updateProfile({ selectedBlocks: Array.from(selected) });
    navigation.navigate('BloquesEspeciales');
  };

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <StepDots total={3} current={1} />
      <Text style={[typography.displayM, styles.title]}>{t('steps.blocksTitle')}</Text>
      <Text style={[typography.body, styles.subtitle]}>{t('steps.blocksSubtitle')}</Text>

      {BLOCK_CATEGORIES.map((category) => {
        const isSelected = selected.has(category.key);
        return (
          <Pressable
            key={category.key}
            onPress={() => toggle(category.key)}
            style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
          >
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[typography.subtitle, styles.categoryTitle]}>{t(category.titleKey)}</Text>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
            </View>
            <Text
              style={[
                typography.caption,
                styles.optionsPreview,
                isSelected && styles.optionsPreviewSelected,
              ]}
              numberOfLines={1}
            >
              {category.options.map((o) => t(o.labelKey)).join(' · ')}
            </Text>
          </Pressable>
        );
      })}

      <GlowButton
        label={t('common.continue')}
        onPress={handleContinue}
        disabled={selected.size === 0}
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
    marginBottom: spacing.xl,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryCardSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  categoryTitle: {
    color: colors.textPrimary,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
  optionsPreview: {
    color: colors.textTertiary,
    marginTop: spacing.sm,
    marginLeft: 30,
  },
  optionsPreviewSelected: {
    color: colors.textSecondary,
  },
  continueButton: {
    marginTop: spacing.lg,
  },
});
