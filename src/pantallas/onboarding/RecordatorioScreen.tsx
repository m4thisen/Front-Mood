import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PasoOnboarding } from '@/componentes/PasoOnboarding';
import { Boton } from '@/componentes/Boton';
import { Icono } from '@/componentes/Icono';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useSesionStore } from '@/stores/SesionStore';
import { RootStackParamList } from '@/navegacion/tipos';
import { formatearHora, HORA_RECORDATORIO_POR_DEFECTO, partesHora } from '@/dominio';
import { localeSelector } from '@/utils/fecha';

type Props = NativeStackScreenProps<RootStackParamList, 'Recordatorio'>;

const aFecha = (horaTexto: string): Date => {
  const { hora, minuto } = partesHora(horaTexto);
  const d = new Date();
  d.setHours(hora, minuto, 0, 0);
  return d;
};

/** Paso 4 del onboarding (CU-04, pasos 7 a 10): hora del recordatorio diario. */
export const RecordatorioScreen: React.FC<Props> = ({ navigation }) => {
  const { t, language } = useTranslation();
  const horaGuardada = useSesionStore((s) => s.usuario?.horaRecordatorio);
  const actualizarPreferencias = useSesionStore((s) => s.actualizarPreferencias);
  const programarRecordatorio = useSesionStore((s) => s.programarRecordatorio);

  const [hora, setHora] = useState(aFecha(horaGuardada ?? HORA_RECORDATORIO_POR_DEFECTO));
  const [guardando, setGuardando] = useState(false);

  const terminar = async () => {
    setGuardando(true);
    const texto = formatearHora(hora.getHours(), hora.getMinutes());
    await actualizarPreferencias({ horaRecordatorio: texto });
    const programado = await programarRecordatorio(true);
    setGuardando(false);
    // CU-04 E2: sin permiso la configuración se completa igual, avisando.
    if (!programado) Alert.alert(t('steps.notificationDeniedTitle'), t('steps.notificationDeniedBody'));
    navigation.navigate('ColorDelAlma');
  };

  return (
    <PasoOnboarding
      paso={3}
      titulo={t('steps.notificationTitle')}
      subtitulo={t('steps.notificationSubtitle')}
      onAtras={() => navigation.goBack()}
      pie={<Boton titulo={t('steps.notificationCta')} icono="recordatorio" onPress={terminar} cargando={guardando} />}
    >
      <View style={styles.tarjeta}>
        <DateTimePicker
          value={hora}
          mode="time"
          display="spinner"
          style={{ height: 216 }}
          onValueChange={(_e, fecha) => setHora(fecha)}
          themeVariant="dark"
          locale={localeSelector(language)}
          is24Hour
        />
      </View>
      <View style={styles.nota}>
        <Icono nombre="recordatorio" tamano={14} color={colors.textTertiary} />
        <Text style={[typography.footnote, styles.textoNota]}>{t('steps.notificationHint')}</Text>
      </View>
    </PasoOnboarding>
  );
};

const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  nota: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  textoNota: {
    flex: 1,
    color: colors.textTertiary,
  },
});
