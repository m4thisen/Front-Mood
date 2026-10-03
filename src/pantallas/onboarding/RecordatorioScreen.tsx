import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { GlowButton } from '@/componentes/GlowButton';
import { StepDots } from '@/componentes/StepDots';
import { colors, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useApp } from '@/context/AppContext';
import { RootStackParamList } from '@/navegacion/tipos';
import { scheduleDailyReminder } from '@/servicios/NotificacionService';

type Props = NativeStackScreenProps<RootStackParamList, 'Recordatorio'>;

const buildTime = (hour: number, minute: number): Date => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
};

export const RecordatorioScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { profile, updateProfile, completeOnboarding } = useApp();

  const [time, setTime] = useState(
    buildTime(profile?.notificationHour ?? 21, profile?.notificationMinute ?? 0)
  );

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTime(selected);
  };

  const handleFinish = async () => {
    const hour = time.getHours();
    const minute = time.getMinutes();
    updateProfile({ notificationHour: hour, notificationMinute: minute });
    completeOnboarding();
    scheduleDailyReminder(hour, minute, t('appName'), t('welcome.description'));
    navigation.reset({ index: 0, routes: [{ name: 'ColorDelAlma' }] });
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View>
        <StepDots total={3} current={2} />
        <Text style={[typography.displayM, styles.title]}>{t('steps.notificationTitle')}</Text>
        <Text style={[typography.body, styles.subtitle]}>{t('steps.notificationSubtitle')}</Text>

        <View style={styles.pickerCard}>
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            themeVariant="dark"
            is24Hour
          />
        </View>
      </View>

      <GlowButton label={t('common.finish')} onPress={handleFinish} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  pickerCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
