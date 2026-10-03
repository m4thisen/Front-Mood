import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { GlowButton } from '@/componentes/GlowButton';
import { StepDots } from '@/componentes/StepDots';
import { colors, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useSesionStore } from '@/stores/SesionStore';
import { formatearHora, HORA_RECORDATORIO_POR_DEFECTO, partesHora } from '@/dominio';
import { RootStackParamList } from '@/navegacion/tipos';
import { programarRecordatorio } from '@/servicios/NotificacionService';

type Props = NativeStackScreenProps<RootStackParamList, 'Recordatorio'>;

const aFecha = (horaTexto: string): Date => {
  const { hora, minuto } = partesHora(horaTexto);
  const d = new Date();
  d.setHours(hora, minuto, 0, 0);
  return d;
};

export const RecordatorioScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const horaGuardada = useSesionStore((s) => s.usuario?.horaRecordatorio);
  const actualizarPreferencias = useSesionStore((s) => s.actualizarPreferencias);

  const [time, setTime] = useState(aFecha(horaGuardada ?? HORA_RECORDATORIO_POR_DEFECTO));

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTime(selected);
  };

  const handleFinish = async () => {
    const hora = formatearHora(time.getHours(), time.getMinutes());
    await actualizarPreferencias({ horaRecordatorio: hora });
    const programado = await programarRecordatorio(hora, t('appName'), t('welcome.description'));
    // CU-04 E2: sin permiso la configuración se completa igual, avisando.
    if (!programado) Alert.alert(t('steps.notificationDeniedTitle'), t('steps.notificationDeniedBody'));
    navigation.navigate('ColorDelAlma');
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
