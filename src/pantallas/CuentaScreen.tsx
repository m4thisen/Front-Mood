import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ScreenContainer } from '@/componentes/ScreenContainer';
import { Card } from '@/componentes/Card';
import { GlowButton } from '@/componentes/GlowButton';
import { BlockChip } from '@/componentes/BlockChip';
import { EditorTags } from '@/componentes/EditorTags';
import { colors, spacing, typography, TAB_BAR_CLEARANCE } from '@/tema';
import { useTranslation } from '@/i18n';
import { useSesionStore } from '@/stores/SesionStore';
import { useIndicadoresProgreso, useListaRegistros } from '@/stores/RegistroStore';
import { exportarCSV, exportarPDF } from '@/servicios/ExportService';
import { programarRecordatorio } from '@/servicios/NotificacionService';
import { BLOQUES, claveTraduccionBloque } from '@/datos/catalogoBloques';
import { formatearHora, HORA_RECORDATORIO_POR_DEFECTO, Idioma, partesHora } from '@/dominio';

const aFecha = (horaTexto: string): Date => {
  const { hora, minuto } = partesHora(horaTexto);
  const d = new Date();
  d.setHours(hora, minuto, 0, 0);
  return d;
};

export const CuentaScreen: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const usuario = useSesionStore((s) => s.usuario);
  const tags = useSesionStore((s) => s.tags);
  const actualizarPreferencias = useSesionStore((s) => s.actualizarPreferencias);
  const cerrarSesion = useSesionStore((s) => s.cerrarSesion);
  const registros = useListaRegistros();
  const { rachaActual, diasRegistrados } = useIndicadoresProgreso();

  const horaRecordatorio = usuario?.horaRecordatorio ?? HORA_RECORDATORIO_POR_DEFECTO;
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [draftTime, setDraftTime] = useState(aFecha(horaRecordatorio));

  const changeLanguage = (idioma: Idioma) => {
    setLanguage(idioma);
    actualizarPreferencias({ idioma });
  };

  // CU-07: desactivar un bloque no borra lo ya registrado; si quedan todos
  // desactivados, se advierte que el registro queda reducido (excepción E1).
  const toggleBloque = (clave: string) => {
    const activos = usuario?.bloquesActivos ?? [];
    const siguiente = activos.includes(clave) ? activos.filter((c) => c !== clave) : [...activos, clave];
    if (siguiente.length === 0) {
      Alert.alert(t('account.blocks'), t('account.noBlocksWarning'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.continue'), onPress: () => actualizarPreferencias({ bloquesActivos: [] }) },
      ]);
      return;
    }
    actualizarPreferencias({ bloquesActivos: siguiente });
  };

  const handleExportCsv = () => exportarCSV(registros, tags);
  const handleExportPdf = () => exportarPDF(registros, usuario, tags);

  const openTimeEditor = () => {
    setDraftTime(aFecha(horaRecordatorio));
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed') return;
    if (selected) setDraftTime(selected);
  };

  const handleSaveTime = async () => {
    const hora = formatearHora(draftTime.getHours(), draftTime.getMinutes());
    await actualizarPreferencias({ horaRecordatorio: hora });
    const programado = await programarRecordatorio(hora, t('appName'), t('welcome.description'));
    if (!programado) Alert.alert(t('steps.notificationDeniedTitle'), t('steps.notificationDeniedBody'));
    setShowTimePicker(false);
  };

  // CU-03: se pide confirmación y se avisa que los datos locales se conservan.
  const handleLogout = () => {
    Alert.alert(t('account.logout'), t('account.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.logout'), style: 'destructive', onPress: cerrarSesion },
    ]);
  };

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <Text style={[typography.displayM, styles.header]}>{t('account.title')}</Text>

      <Card style={styles.profileCard} elevated>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{usuario?.nombre?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[typography.title, styles.name]}>{usuario?.nombre}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[typography.title, styles.statValue]}>{rachaActual}</Text>
            <Text style={[typography.caption, styles.statLabel]}>{t('account.streak')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[typography.title, styles.statValue]}>{diasRegistrados}</Text>
            <Text style={[typography.caption, styles.statLabel]}>{t('account.totalEntries')}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[typography.subtitle, styles.cardTitle]}>{t('account.language')}</Text>
        <View style={styles.chipsRow}>
          {(['es', 'en'] as const).map((lang) => (
            <BlockChip
              key={lang}
              label={lang === 'es' ? 'Español' : 'English'}
              selected={language === lang}
              onPress={() => changeLanguage(lang)}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.notificationHeader}>
          <Text style={[typography.subtitle, styles.cardTitle]}>{t('account.notificationTime')}</Text>
          {!showTimePicker && (
            <Pressable onPress={openTimeEditor}>
              <Text style={[typography.bodyMedium, styles.editLink]}>
                {t('account.editNotificationTime')}
              </Text>
            </Pressable>
          )}
        </View>

        {!showTimePicker ? (
          <Text style={[typography.displayM, styles.notificationTime]}>
            {horaRecordatorio}
          </Text>
        ) : (
          <View>
            <View style={styles.pickerCard}>
              <DateTimePicker
                value={draftTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                themeVariant="dark"
                is24Hour
              />
            </View>
            <GlowButton
              label={t('account.saveNotificationTime')}
              onPress={handleSaveTime}
              variant="secondary"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={[typography.subtitle, styles.cardTitle]}>{t('account.blocks')}</Text>
        <View style={styles.chipsRow}>
          {BLOQUES.map((bloque) => (
            <BlockChip
              key={bloque.clave}
              icon={bloque.icono}
              label={t(claveTraduccionBloque(bloque.clave))}
              selected={usuario?.bloquesActivos.includes(bloque.clave) ?? false}
              onPress={() => toggleBloque(bloque.clave)}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[typography.subtitle, styles.cardTitle]}>{t('account.customTags')}</Text>
        <EditorTags />
      </Card>

      <Card style={styles.card}>
        <Text style={[typography.subtitle, styles.cardTitle]}>{t('account.exportData')}</Text>
        <Text style={[typography.caption, styles.cardDesc]}>{t('account.exportDataDesc')}</Text>
        <View style={styles.exportRow}>
          <GlowButton
            label={t('account.exportCsv')}
            onPress={handleExportCsv}
            variant="secondary"
            style={styles.exportButton}
          />
          <GlowButton
            label={t('account.exportPdf')}
            onPress={handleExportPdf}
            variant="secondary"
            style={styles.exportButton}
          />
        </View>
      </Card>

      <GlowButton label={t('account.logout')} onPress={handleLogout} variant="ghost" />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  header: {
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  profileCard: {
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  avatarInitial: {
    color: colors.accent,
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
  },
  profileInfo: {
    marginLeft: spacing.md,
  },
  name: {
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.accent,
  },
  statLabel: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
  },
  cardDesc: {
    color: colors.textTertiary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editLink: {
    color: colors.accent,
  },
  notificationTime: {
    color: colors.accent,
    marginTop: spacing.sm,
  },
  pickerCard: {
    backgroundColor: colors.surfaceElevatedAlt,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  exportRow: {
    flexDirection: 'row',
  },
  exportButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
