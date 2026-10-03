import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icono } from './Icono';
import { iconoDeEtiqueta } from './iconosDominio';
import { colors, radius, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';
import { useListaRegistros } from '@/stores/RegistroStore';
import { generateRecommendedHabits } from '@/api/simulado/devolucionesSimuladas';

/**
 * Hábitos sugeridos dentro de la devolución. Si hay datos suficientes se
 * ordenan por su relación con el ánimo; si no, se muestran sugerencias
 * generales. La redacción es simulada hasta la iteración 5.
 */
export const HabitRecommendationCard: React.FC = () => {
  const { t } = useTranslation();
  const registros = useListaRegistros();
  const habitos = useMemo(() => generateRecommendedHabits(registros, t), [registros, t]);

  return (
    <View style={styles.tarjeta}>
      {habitos.map((habito, i) => (
        <React.Fragment key={habito.clave}>
          {i > 0 && <View style={styles.separador} />}
          <View style={styles.fila}>
            <View style={styles.cuadroIcono}>
              <Icono nombre={iconoDeEtiqueta(habito.clave)} tamano={15} color="#FFFFFF" peso="semibold" />
            </View>
            <View style={styles.textos}>
              <Text style={[typography.bodyMedium, styles.titulo]}>{habito.label}</Text>
              <Text style={[typography.footnote, styles.motivo]}>{habito.reason}</Text>
            </View>
            {habito.percent !== null && (
              <Text style={[typography.numero, styles.porcentaje]}>+{habito.percent}%</Text>
            )}
          </View>
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.lg,
  },
  separador: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: 28 + spacing.md,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  cuadroIcono: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
  },
  titulo: {
    color: colors.textPrimary,
  },
  motivo: {
    color: colors.textTertiary,
    marginTop: 1,
  },
  porcentaje: {
    color: colors.textPrimary,
  },
});
