import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ScreenContainer } from '@/components/ScreenContainer';
import { GlowButton } from '@/components/GlowButton';
import { BlockChip } from '@/components/BlockChip';
import { StepDots } from '@/components/StepDots';
import { colors, radius, spacing, typography } from '@/theme';
import { useTranslation } from '@/i18n';
import { useApp } from '@/context/AppContext';
import { RootStackParamList } from '@/navigation/types';
import { Gender } from '@/types/models';
import { dateLocale, toISODate } from '@/utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const GENDERS: Gender[] = ['female', 'male', 'nonbinary', 'prefer_not_to_say'];

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { t, language } = useTranslation();
  const { profile, updateProfile } = useApp();

  const [name, setName] = useState(profile?.name ?? '');
  const [birthDate, setBirthDate] = useState<Date | null>(
    profile?.birthDate ? new Date(profile.birthDate) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'prefer_not_to_say');

  const canContinue = name.trim().length > 0 && birthDate !== null;

  const handleContinue = () => {
    updateProfile({
      name: name.trim(),
      birthDate: birthDate ? toISODate(birthDate) : '',
      gender,
    });
    navigation.navigate('BlocksSelection');
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    if (selected) setBirthDate(selected);
  };

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <StepDots total={3} current={0} />
      <Text style={[typography.displayM, styles.title]}>{t('register.title')}</Text>
      <Text style={[typography.body, styles.subtitle]}>{t('register.subtitle')}</Text>

      <View style={styles.field}>
        <Text style={[typography.caption, styles.label]}>{t('register.name')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('register.namePlaceholder')}
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={[typography.caption, styles.label]}>{t('register.birthDate')}</Text>
        <Pressable onPress={() => setShowDatePicker(true)} style={styles.pickerTrigger}>
          <Text style={[typography.bodyMedium, birthDate ? styles.pickerValue : styles.pickerPlaceholder]}>
            {birthDate
              ? format(birthDate, 'd MMMM yyyy', { locale: dateLocale(language) })
              : t('register.birthDatePlaceholder')}
          </Text>
        </Pressable>

        {showDatePicker && (
          <View style={Platform.OS === 'ios' ? styles.iosPickerWrap : undefined}>
            <DateTimePicker
              value={birthDate ?? new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={handleDateChange}
              themeVariant="dark"
              locale={language === 'es' ? 'es-ES' : 'en-US'}
            />
            {Platform.OS === 'ios' && (
              <GlowButton
                label={t('common.done')}
                onPress={() => setShowDatePicker(false)}
                variant="secondary"
                style={{ marginTop: spacing.sm }}
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.field}>
        <Text style={[typography.caption, styles.label]}>{t('register.gender')}</Text>
        <View style={styles.chipsRow}>
          {GENDERS.map((g) => (
            <BlockChip
              key={g}
              label={t(`register.gender.${g}`)}
              selected={gender === g}
              onPress={() => setGender(g)}
            />
          ))}
        </View>
      </View>

      <GlowButton
        label={t('common.continue')}
        onPress={handleContinue}
        disabled={!canContinue}
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
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textTertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
  },
  pickerTrigger: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  pickerValue: {
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  pickerPlaceholder: {
    color: colors.textTertiary,
  },
  iosPickerWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  continueButton: {
    marginTop: spacing.lg,
  },
});
