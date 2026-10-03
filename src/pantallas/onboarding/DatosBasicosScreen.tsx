import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { GlowButton } from '@/componentes/GlowButton';
import { BlockChip } from '@/componentes/BlockChip';
import { StepDots } from '@/componentes/StepDots';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useSesionStore } from '@/stores/SesionStore';
import { RootStackParamList } from '@/navegacion/tipos';
import { calcularEdad, Genero, GENEROS } from '@/dominio';
import { dateLocale, toISODate } from '@/utils/fecha';

type Props = NativeStackScreenProps<RootStackParamList, 'DatosBasicos'>;

export const DatosBasicosScreen: React.FC<Props> = ({ navigation }) => {
  const { t, language } = useTranslation();
  const usuario = useSesionStore((s) => s.usuario);
  const actualizarPreferencias = useSesionStore((s) => s.actualizarPreferencias);

  const [name, setName] = useState(usuario?.nombre ?? '');
  const [birthDate, setBirthDate] = useState<Date | null>(
    usuario?.fechaNacimiento ? parseISO(usuario.fechaNacimiento) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Genero>(usuario?.genero ?? 'PREFIERO_NO_DECIR');

  const canContinue = name.trim().length > 0 && birthDate !== null;

  const handleContinue = async () => {
    await actualizarPreferencias({
      nombre: name.trim(),
      fechaNacimiento: birthDate ? toISODate(birthDate) : '',
      genero: gender,
    });
    navigation.navigate('Bloques');
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    if (selected) setBirthDate(selected);
  };

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <StepDots total={4} current={0} />
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
        {birthDate && (
          <Text style={[typography.caption, styles.age]}>
            {t('register.age').replace('{edad}', String(calcularEdad(toISODate(birthDate))))}
          </Text>
        )}

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
          {GENEROS.map((g) => (
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
  age: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
