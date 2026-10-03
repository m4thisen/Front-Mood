import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icono } from './Icono';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useIndicadoresProgreso, useListaRegistros } from '@/stores/RegistroStore';
import { generateAiSummary } from '@/api/simulado/devolucionesSimuladas';

/**
 * Devolución "Cómo venís" (CU-21). Hoy es simulada (ver
 * api/simulado/devolucionesSimuladas.ts); en la iteración 5 llega del
 * servidor, que la pide a Claude con datos agregados, sin el texto libre.
 */
export const AiSummaryCard: React.FC = () => {
  const { t } = useTranslation();
  const registros = useListaRegistros();
  const { rachaActual } = useIndicadoresProgreso();

  const resumen = useMemo(() => generateAiSummary(registros, rachaActual, t), [registros, rachaActual, t]);

  return (
    <View style={styles.tarjeta}>
      <View style={styles.cabecera}>
        <View style={styles.cuadroIcono}>
          <Icono nombre="ia" tamano={16} color={colors.accentStrong} peso="semibold" />
        </View>
        <Text style={[typography.headline, styles.titulo]}>{t('ai.summaryTitle')}</Text>
        <View style={styles.pastilla}>
          <Text style={[typography.micro, styles.textoPastilla]}>{t('ai.badgeShort')}</Text>
        </View>
      </View>
      <Text style={[typography.body, styles.cuerpo]}>{resumen ?? t('ai.noData')}</Text>
      <View style={styles.privacidad}>
        <Icono nombre="candado" tamano={11} color={colors.textTertiary} />
        <Text style={[typography.micro, styles.textoPrivacidad]}>{t('ai.privacy')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cuadroIcono: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    flex: 1,
    color: colors.textPrimary,
  },
  pastilla: {
    backgroundColor: colors.fill,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  textoPastilla: {
    color: colors.textTertiary,
  },
  cuerpo: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  privacidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.md,
  },
  textoPrivacidad: {
    flex: 1,
    color: colors.textTertiary,
  },
});
